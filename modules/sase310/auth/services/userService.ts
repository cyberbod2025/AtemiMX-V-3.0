import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentSnapshot,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { updateProfile, type User } from "firebase/auth";
import { z } from "zod";

import { registerUser } from "../../../../services/authService";
import { auth, db } from "../../../../services/firebase";

const USERS_COLLECTION = "users";
const DOCENTES_COLLECTION = "docentes";
const WHITELIST_COLLECTION = "plantilla_docente";

const ROLE_VALUES = ["docente", "prefectura", "orientacion", "coordinacion", "direccion", "admin"] as const;

const userProfileSchema = z.object({
  email: z.string().email(),
  nombreCompleto: z.string().min(3).max(140).optional(),
  nombreNormalizado: z.string().min(3).max(140).optional(),
  rol: z.enum(ROLE_VALUES),
  autorizado: z.boolean(),
  fechaRegistro: z.instanceof(Timestamp).optional(),
  autorizadoPor: z.string().nullable().optional(),
  plantillaDocenteId: z.string().optional(),
});

const teacherProfileSchema = z.object({
  nombre: z.string().min(3).max(120),
  plantel: z.string().min(2).max(80),
  extension: z.string().min(1).max(10).optional(),
  createdAt: z.instanceof(Timestamp).optional(),
  updatedAt: z.instanceof(Timestamp).optional(),
});

const whitelistEntrySchema = z.object({
  nombre_completo: z.string().min(3).max(140),
  registrado: z.boolean(),
  uid_asociado: z.string().nullable(),
  rol: z.enum(ROLE_VALUES),
});

type UserProfileRecord = z.infer<typeof userProfileSchema>;
type TeacherProfileRecord = z.infer<typeof teacherProfileSchema>;
type WhitelistEntryRecord = z.infer<typeof whitelistEntrySchema>;

export type UserRole = (typeof ROLE_VALUES)[number];
export type AssignableRole = Exclude<UserRole, "admin">;

export interface UserProfile extends UserProfileRecord {
  id: string;
}

export interface TeacherProfile extends TeacherProfileRecord {
  id: string;
}

interface WhitelistEntry extends WhitelistEntryRecord {
  id: string;
}

export interface WhitelistRegistrationPayload {
  nombreCompleto: string;
  email: string;
  password: string;
}

export interface WhitelistRegistrationResult {
  user: User;
  profile: UserProfile;
}

const normalizeFullName = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

const toWhitelistDocId = (normalizedName: string): string => normalizedName.replace(/\s+/g, "_");

const formatDisplayName = (value: string): string => {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return "";
  }
  return cleaned
    .toLowerCase()
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const parseUserDoc = (snapshot: DocumentSnapshot): UserProfile | null => {
  if (!snapshot.exists()) {
    return null;
  }

  const parsed = userProfileSchema.safeParse(snapshot.data());
  if (!parsed.success) {
    console.error("[SASE-310] Perfil de usuario invalido:", parsed.error);
    return null;
  }

  const record = parsed.data;
  const nombreCompleto = record.nombreCompleto ?? formatDisplayName(snapshot.get("nombre") ?? "");
  const nombreNormalizado = record.nombreNormalizado ?? normalizeFullName(nombreCompleto || record.email);

  return {
    id: snapshot.id,
    ...record,
    nombreCompleto: nombreCompleto || record.email,
    nombreNormalizado,
    fechaRegistro: record.fechaRegistro ?? Timestamp.now(),
    autorizadoPor: record.autorizadoPor ?? null,
  };
};

const parseTeacherDoc = (snapshot: DocumentSnapshot): TeacherProfile | null => {
  if (!snapshot.exists()) {
    return null;
  }

  const parsed = teacherProfileSchema.safeParse(snapshot.data());
  if (!parsed.success) {
    console.error("[SASE-310] Datos docentes invalidos:", parsed.error);
    return null;
  }

  const record = parsed.data;
  return {
    id: snapshot.id,
    ...record,
    createdAt: record.createdAt ?? Timestamp.now(),
    updatedAt: record.updatedAt ?? Timestamp.now(),
  };
};

const parseWhitelistDoc = (snapshot: DocumentSnapshot): WhitelistEntry | null => {
  if (!snapshot.exists()) {
    return null;
  }

  const parsed = whitelistEntrySchema.safeParse(snapshot.data());
  if (!parsed.success) {
    console.error("[SASE-310] Entrada de plantilla invalida:", parsed.error);
    return null;
  }

  return {
    id: snapshot.id,
    ...parsed.data,
  };
};

const handleFirestoreError = (context: string, error: unknown): never => {
  if (error instanceof FirebaseError) {
    console.error(`[SASE-310] ${context} (code: ${error.code})`);
  } else {
    console.error(`[SASE-310] ${context}:`, error);
  }
  throw new Error("No se pudo completar la operacion solicitada. Intenta mas tarde.");
};

const fetchWhitelistEntry = async (normalizedName: string): Promise<WhitelistEntry | null> => {
  const docId = toWhitelistDocId(normalizedName);
  const directRef = doc(db, WHITELIST_COLLECTION, docId);

  try {
    const directSnapshot = await getDoc(directRef);
    const directEntry = parseWhitelistDoc(directSnapshot);
    if (directEntry) {
      return directEntry;
    }
  } catch (error) {
    if (error instanceof FirebaseError && error.code !== "permission-denied") {
      throw error;
    }
    if (!(error instanceof FirebaseError)) {
      throw error;
    }
  }

  try {
    const whitelistRef = collection(db, WHITELIST_COLLECTION);
    const matchQuery = query(whitelistRef, where("nombre_completo", "==", normalizedName));
    const snapshot = await getDocs(matchQuery);
    const firstMatch = snapshot.docs[0];
    return firstMatch ? parseWhitelistDoc(firstMatch) : null;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === "permission-denied") {
      throw new Error("No fue posible validar la plantilla de docentes. Contacta al administrador.");
    }
    throw error;
  }
};

const rollbackNewUser = async (user: User): Promise<void> => {
  try {
    await user.delete();
  } catch (deleteError) {
    console.error(`[SASE-310] No se pudo revertir el usuario ${user.uid}:`, deleteError);
  } finally {
    if (auth.currentUser?.uid === user.uid) {
      await auth.signOut().catch(() => undefined);
    }
  }
};

export const registerUserWithWhitelist = async (payload: WhitelistRegistrationPayload): Promise<WhitelistRegistrationResult> => {
  const displayName = formatDisplayName(payload.nombreCompleto);
  const normalizedName = normalizeFullName(payload.nombreCompleto);
  const normalizedEmail = payload.email.trim().toLowerCase();

  if (!displayName || !normalizedName) {
    throw new Error("Ingresa tu nombre completo tal como aparece en la plantilla autorizada.");
  }

  let firebaseUser: User | null = null;
  try {
    firebaseUser = await registerUser(normalizedEmail, payload.password);
    await updateProfile(firebaseUser, { displayName }).catch(() => undefined);

    const whitelistEntry = await fetchWhitelistEntry(normalizedName);
    if (!whitelistEntry) {
      throw new Error("No fue posible validar la plantilla autorizada. Contacta al administrador.");
    }

    if (whitelistEntry.registrado && whitelistEntry.uid_asociado && whitelistEntry.uid_asociado !== firebaseUser.uid) {
      throw new Error("Este docente ya cuenta con un registro activo.");
    }

    const now = Timestamp.now();
    const profileRecord: UserProfileRecord = {
      email: normalizedEmail,
      nombreCompleto: displayName,
      nombreNormalizado: normalizedName,
      rol: whitelistEntry.rol,
      autorizado: false,
      fechaRegistro: now,
      autorizadoPor: null,
      plantillaDocenteId: whitelistEntry.id,
    };

    const whitelistRef = doc(db, WHITELIST_COLLECTION, whitelistEntry.id);
    const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);

    await runTransaction(db, async (transaction) => {
      const latestSnapshot = await transaction.get(whitelistRef);
      const latestEntry = parseWhitelistDoc(latestSnapshot);
      if (!latestEntry) {
        throw new Error("La plantilla de docentes no se encuentra disponible.");
      }

      if (latestEntry.registrado && latestEntry.uid_asociado && latestEntry.uid_asociado !== firebaseUser!.uid) {
        throw new Error("Este docente ya se autorizo previamente.");
      }

      transaction.set(userRef, profileRecord, { merge: true });
      transaction.update(whitelistRef, {
        registrado: false,
        uid_asociado: firebaseUser.uid,
        correo_registrado: normalizedEmail,
        actualizado_en: now,
      });
    });

    const profile: UserProfile = {
      id: firebaseUser.uid,
      ...profileRecord,
    };

    return { user: firebaseUser, profile };
  } catch (error) {
    if (firebaseUser) {
      await rollbackNewUser(firebaseUser);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("No fue posible completar el registro con la whitelist.");
  }
};

export const ensureUserProfile = async (uid: string, email: string): Promise<UserProfile> => {
  void email;
  const profile = await getUserProfile(uid);
  if (profile) {
    return profile;
  }
  throw new Error("Tu cuenta no esta autorizada en SASE-310. Contacta al administrador.");
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  try {
    const snapshot = await getDoc(userRef);
    return parseUserDoc(snapshot);
  } catch (error) {
    return handleFirestoreError("Recuperacion de perfil fallida", error);
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
      onNext(parseUserDoc(snapshot));
    },
    (error) => {
      console.error("[SASE-310] Observador de perfil fallido:", error);
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
      .map((docSnapshot) => parseUserDoc(docSnapshot))
      .filter((profile): profile is UserProfile => profile !== null)
      .sort((a, b) => b.fechaRegistro.toMillis() - a.fechaRegistro.toMillis());
  } catch (error) {
    return handleFirestoreError("Listado de usuarios pendientes fallido", error);
  }
};

export const approveUser = async (uid: string, rol: AssignableRole): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const authorizedBy = auth.currentUser?.email ?? auth.currentUser?.uid ?? null;
  const approvedAt = Timestamp.now();

  try {
    await runTransaction(db, async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      const profile = parseUserDoc(userSnapshot);
      if (!profile) {
        throw new Error("No se encontró el perfil del usuario a aprobar.");
      }

      transaction.update(userRef, {
        autorizado: true,
        rol,
        autorizadoPor: authorizedBy,
        fechaAutorizacion: approvedAt,
      });

      if (profile.plantillaDocenteId) {
        const whitelistRef = doc(db, WHITELIST_COLLECTION, profile.plantillaDocenteId);
        transaction.update(whitelistRef, {
          registrado: true,
          uid_asociado: uid,
          autorizado_en: approvedAt,
          autorizado_por: authorizedBy,
        });
      }
    });
  } catch (error) {
    handleFirestoreError("Aprobacion de usuario fallida", error);
  }
};

export const observeTeacherProfile = (
  uid: string,
  onNext: (profile: TeacherProfile | null) => void,
  onError?: (error: Error) => void,
): (() => void) => {
  const teacherRef = doc(db, DOCENTES_COLLECTION, uid);
  return onSnapshot(
    teacherRef,
    (snapshot) => {
      onNext(parseTeacherDoc(snapshot));
    },
    (error) => {
      console.error("[SASE-310] Observador de datos docentes fallido:", error);
      onError?.(error);
    },
  );
};

export const saveTeacherProfile = async (uid: string, data: TeacherProfileRecord): Promise<void> => {
  const teacherRef = doc(db, DOCENTES_COLLECTION, uid);
  try {
    const payload: TeacherProfileRecord = {
      ...data,
      createdAt: data.createdAt ?? Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(teacherRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError("Registro de datos docentes fallido", error);
  }
};

export const getTeacherProfile = async (uid: string): Promise<TeacherProfile | null> => {
  const teacherRef = doc(db, DOCENTES_COLLECTION, uid);
  try {
    const snapshot = await getDoc(teacherRef);
    return parseTeacherDoc(snapshot);
  } catch (error) {
    return handleFirestoreError("Recuperacion de datos docentes fallida", error);
  }
};
