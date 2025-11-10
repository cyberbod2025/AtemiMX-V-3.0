import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

import { db } from "@/services/firebase";
import type { Report, Comment, Evidence, ReportStatus } from "@/dashboard/types";

const COLLECTION = "incidentMetadata";

export const upsertIncidentMetadata = async (report: Report): Promise<void> => {
  const docRef = doc(db, COLLECTION, report.id);
  await setDoc(
    docRef,
    {
      ...report,
      updatedAtServer: serverTimestamp(),
    },
    { merge: true },
  );
};

export const fetchIncidentMetadataByTeacher = async (teacherId: string): Promise<Report[]> => {
  const ref = collection(db, COLLECTION);
  const q = query(ref, where("teacherId", "==", teacherId), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.data() as Report);
};

export const fetchAllIncidentMetadata = async (): Promise<Report[]> => {
  const ref = collection(db, COLLECTION);
  const q = query(ref, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.data() as Report);
};

export const appendComment = async (reportId: string, comment: Comment): Promise<void> => {
  const docRef = doc(db, COLLECTION, reportId);
  await updateDoc(docRef, {
    comments: arrayUnion(comment),
    updatedAtServer: serverTimestamp(),
  });
};

export const appendEvidence = async (reportId: string, evidence: Evidence): Promise<void> => {
  const docRef = doc(db, COLLECTION, reportId);
  await updateDoc(docRef, {
    evidence: arrayUnion(evidence),
    updatedAtServer: serverTimestamp(),
  });
};

export const updateStatus = async (reportId: string, status: ReportStatus, notes?: string): Promise<void> => {
  const docRef = doc(db, COLLECTION, reportId);
  await updateDoc(docRef, {
    status,
    resolutionNotes: notes ?? null,
    updatedAtServer: serverTimestamp(),
  });
};
