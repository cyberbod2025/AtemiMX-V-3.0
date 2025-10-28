import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentSnapshot,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { z } from "zod";

import { auth, db } from "../../../../services/firebase";

const USERS_COLLECTION = "users";

const ROLE_VALUES = ["docente", "prefectura", "orientacion", "direccion", "admin"] as const;

const userProfileSchema = z.object({
  email: z.string().email(),
  rol: z.enum(ROLE_VALUES).default("docente"),
  autorizado: z.boolean(),
  fechaRegistro: z.instanceof(Timestamp).optional(),
  autorizadoPor: z.string().nullable().optional(),
});

type UserProfileRecord = z.infer<typeof userProfileSchema>;

export type UserRole = (typeof ROLE_VALUES)[number];

export type AssignableRole = Exclude<UserRole, "admin">;

export interface UserProfile extends UserProfileRecord {
  id: string;
}

const mapUserDoc = (snapshot: DocumentSnapshot): UserProfile | null => {
  if (!snapshot.exists()) {
    return null;
  }

  const parsed = userProfileSchema.safeParse(snapshot.data());
  if (!parsed.success) {
    console.error("[Auth2.0] Perfil de usuario invalido:", parsed.error);
    return null;
  }

  const record = parsed.data;
  return {
    id: snapshot.id,
    ...record,
    fechaRegistro: record.fechaRegistro ?? Timestamp.now(),
    autorizadoPor: record.autorizadoPor ?? null,
  };
};

const handleFirestoreError = (context: string, error: unknown): never => {
  if (error instanceof FirebaseError) {
    console.error(`[Auth2.0] ${context} (code: ${error.code})`);
  } else {
    console.error(`[Auth2.0] ${context}:`, error);
  }
  throw new Error("No se pudo completar la operacion solicitada. Intenta mas tarde.");
};

export const ensureUserProfile = async (uid: string, email: string): Promise<UserProfile> => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  try {
    const existingSnapshot = await getDoc(userRef);
    const existingProfile = mapUserDoc(existingSnapshot);
    if (existingProfile) {
      return existingProfile;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record: UserProfileRecord = {
      email: normalizedEmail,
      rol: "docente",
      autorizado: false,
      fechaRegistro: Timestamp.now(),
      autorizadoPor: null,
    };

    await setDoc(userRef, record);
    return { id: uid, ...record };
  } catch (error) {
    return handleFirestoreError("Creacion de perfil docente fallida", error);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  try {
    const snapshot = await getDoc(userRef);
    return mapUserDoc(snapshot);
  } catch (error) {
    return handleFirestoreError("Recuperacion de perfil docente fallida", error);
  }
};

export const observeUserProfile = (
  uid: string,
  onNext: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void,
): (() => void) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  return onSnapshot(
    userRef,
    (snapshot) => {
      onNext(mapUserDoc(snapshot));
    },
    (error) => {
      console.error("[Auth2.0] Observador de perfil docente fallido:", error);
      onError?.(error);
    },
  );
};

export const getPendingUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const pendingQuery = query(usersRef, where("autorizado", "==", false));
    const snapshot = await getDocs(pendingQuery);
    return snapshot.docs
      .map((docSnapshot) => mapUserDoc(docSnapshot))
      .filter((profile): profile is UserProfile => profile !== null)
      .sort((a, b) => b.fechaRegistro.toMillis() - a.fechaRegistro.toMillis());
  } catch (error) {
    return handleFirestoreError("Listado de usuarios pendientes fallido", error);
  }
};

export const approveUser = async (uid: string, rol: AssignableRole): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const authorizedBy = auth.currentUser?.email ?? auth.currentUser?.uid ?? null;

  try {
    await updateDoc(userRef, {
      autorizado: true,
      rol,
      autorizadoPor: authorizedBy,
    });
  } catch (error) {
    handleFirestoreError("Aprobacion de usuario fallida", error);
  }
};
