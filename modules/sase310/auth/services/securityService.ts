import { httpsCallable } from "firebase/functions";

import { functions } from "../../../../services/firebase";

export interface SensitiveAccessPayload {
  resource: string;
  reason?: string;
}

interface SensitiveAccessResponse {
  recorded: boolean;
  timestamp: string;
}

const logSensitiveAccessFn = httpsCallable<SensitiveAccessPayload, SensitiveAccessResponse>(
  functions,
  "logSensitiveAccess",
);

export const logSensitiveAccess = async (payload: SensitiveAccessPayload): Promise<SensitiveAccessResponse> => {
  try {
    if (!payload.resource || payload.resource.trim().length === 0) {
      throw new Error("Especifica el recurso que deseas consultar.");
    }
    const response = await logSensitiveAccessFn({
      resource: payload.resource,
      reason: payload.reason ?? null,
    });
    return response.data;
  } catch (error) {
    console.error("[SASE-310] No se pudo registrar el acceso sensible:", error);
    throw new Error("No fue posible validar la reautenticacion.");
  }
};
