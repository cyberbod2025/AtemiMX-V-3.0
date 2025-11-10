import { doc, getDoc, setDoc } from "firebase/firestore";

import type { GradebookModel } from "@/dashboard/modules/gradebook/types";
import { db } from "@/services/firebase";

const COLLECTION = "gradebooks";

export const fetchGradebookModel = async (teacherId: string): Promise<GradebookModel | null> => {
  const docRef = doc(db, COLLECTION, teacherId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as GradebookModel;
};

export const persistGradebookModel = async (teacherId: string, model: GradebookModel): Promise<void> => {
  const docRef = doc(db, COLLECTION, teacherId);
  await setDoc(docRef, model, { merge: true });
};
