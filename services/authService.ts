import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";

import { auth } from "./firebase";

const logAuthError = (context: string, error: unknown): void => {
  if (error instanceof FirebaseError) {
    console.error(`[Auth] ${context} (code: ${error.code})`);
    return;
  }
  console.error(`[Auth] ${context}:`, error);
};

const persistencePromise: Promise<void> = setPersistence(auth, browserLocalPersistence).catch((error) => {
  logAuthError("Failed to set persistence", error);
  throw error;
});

const mapAuthError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "El correo electronico ya esta registrado.";
      case "auth/invalid-email":
        return "El formato del correo electronico no es valido.";
      case "auth/weak-password":
        return "La contrasena debe cumplir con los requisitos minimos de seguridad.";
      case "auth/user-not-found":
      case "auth/invalid-credential":
        return "Las credenciales ingresadas son incorrectas.";
      case "auth/wrong-password":
        return "La contrasena es incorrecta.";
      case "auth/too-many-requests":
        return "Se detectaron multiples intentos fallidos. Intenta mas tarde.";
      case "auth/network-request-failed":
        return "No se pudo establecer conexion con el servicio de autenticacion.";
      case "auth/configuration-not-found":
        return "La configuracion de autenticacion no esta disponible. Verifica las credenciales de Firebase.";
      case "auth/internal-error":
        return "El servicio de autenticacion respondio con un error interno. Intenta nuevamente.";
      default:
        return "Ocurrio un error al procesar la solicitud de autenticacion.";
    }
  }

  return "Error inesperado de autenticacion.";
};

const withPersistence = async <T>(fn: (authInstance: Auth) => Promise<T>): Promise<T> => {
  try {
    await persistencePromise;
    return await fn(auth);
  } catch (error) {
    logAuthError("Operation failed", error);
    throw new Error(mapAuthError(error));
  }
};

export const registerUser = async (email: string, password: string): Promise<User> => {
  return withPersistence(async (authInstance) => {
    const credential = await createUserWithEmailAndPassword(authInstance, email, password);
    return credential.user;
  });
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  return withPersistence(async (authInstance) => {
    const credential = await signInWithEmailAndPassword(authInstance, email, password);
    return credential.user;
  });
};

export const logoutUser = async (): Promise<void> => {
  await withPersistence(async (authInstance) => {
    await signOut(authInstance);
  });
};

export const getCurrentUser = (): User | null => auth.currentUser ?? null;

export const observeAuthState = (
  callback: (user: User | null) => void,
  onError?: (error: Error) => void,
): (() => void) =>
  onAuthStateChanged(auth, callback, (error) => {
    logAuthError("Failed to observe auth state", error);
    onError?.(error);
  });



