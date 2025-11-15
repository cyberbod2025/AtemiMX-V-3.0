import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/services/firebase";
import type { PlannerDraft, PlannerEntry } from "@/dashboard/modules/planner/types";

const COLLECTION = "plannerEntries";

export const fetchPlannerEntries = async (teacherId: string): Promise<PlannerEntry[]> => {
  const entriesRef = collection(db, COLLECTION);
  const q = query(entriesRef, where("teacherId", "==", teacherId), orderBy("dateISO", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.data() as PlannerEntry);
};

export const createPlannerEntry = async (draft: PlannerDraft): Promise<PlannerEntry> => {
  const entriesRef = collection(db, COLLECTION);
  const payload = {
    ...draft,
    updatedAtISO: new Date().toISOString(),
  };
  const docRef = await addDoc(entriesRef, payload);
  return { ...(payload as PlannerEntry), id: docRef.id };
};

export const updatePlannerEntry = async (entryId: string, draft: PlannerDraft): Promise<void> => {
  const entryRef = doc(db, COLLECTION, entryId);
  await updateDoc(entryRef, {
    ...draft,
    campoFormativoId: draft.campoFormativoId,
    pdaId: draft.pdaId,
    updatedAtISO: new Date().toISOString(),
  });
};

export const deletePlannerEntry = async (entryId: string): Promise<void> => {
  const entryRef = doc(db, COLLECTION, entryId);
  await deleteDoc(entryRef);
};
