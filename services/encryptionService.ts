type NodeBuffer = typeof import("buffer").Buffer;

const ENCRYPTION_VERSION = 1;
const KEY_ENV = "VITE_ENCRYPTION_MASTER_KEY";

export interface EncryptedPayload {
  version: number;
  iv: string;
  ciphertext: string;
}

export interface EncryptionResult<TMeta = Record<string, unknown>> extends EncryptedPayload {
  meta?: TMeta;
}

export interface EncryptionConfig {
  key?: CryptoKey;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const getCrypto = (): Crypto => {
  const cryptoRef =
    typeof window !== "undefined"
      ? window.crypto
      : typeof globalThis !== "undefined"
        ? (globalThis as typeof globalThis & { crypto?: Crypto })?.crypto
        : undefined;
  if (!cryptoRef) {
    throw new Error("La API de cifrado del navegador no está disponible.");
  }
  return cryptoRef;
};

const getCryptoSubtle = (): SubtleCrypto => {
  const cryptoRef = getCrypto();
  if (!cryptoRef.subtle) {
    throw new Error("El motor de cifrado no está disponible en este entorno.");
  }
  return cryptoRef.subtle;
};

const getNodeBuffer = (): NodeBuffer | null => {
  if (typeof globalThis === "undefined") {
    return null;
  }
  const bufferCtor = (globalThis as { Buffer?: NodeBuffer }).Buffer;
  return typeof bufferCtor === "function" ? bufferCtor : null;
};

const base64ToBytes = (value: string): Uint8Array => {
  const normalized = value.replace(/[^A-Za-z0-9+/=]/g, "");
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    const binary = window.atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  const nodeBuffer = getNodeBuffer();
  if (!nodeBuffer) {
    throw new Error("El entorno actual no soporta decodificación Base64.");
  }
  const buffer = nodeBuffer.from(normalized, "base64");
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
};

const bytesToBase64 = (bytes: ArrayBuffer | Uint8Array): string => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    let binary = "";
    view.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
  }
  const nodeBuffer = getNodeBuffer();
  if (!nodeBuffer) {
    throw new Error("El entorno actual no soporta codificación Base64.");
  }
  return nodeBuffer.from(view).toString("base64");
};

const importMasterKey = (() => {
  let cachedPromise: Promise<CryptoKey> | null = null;
  return (override?: ArrayBuffer): Promise<CryptoKey> => {
    if (override) {
      return getCryptoSubtle().importKey("raw", override, "AES-GCM", false, ["encrypt", "decrypt"]);
    }
    if (!cachedPromise) {
      const rawKey = (import.meta.env as Record<string, string | undefined>)[KEY_ENV];
      if (!rawKey) {
        throw new Error(`Falta la variable de entorno ${KEY_ENV} para habilitar el cifrado.`);
      }
      const keyBytes = base64ToBytes(rawKey.trim());
      cachedPromise = getCryptoSubtle().importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
    }
    return cachedPromise;
  };
})();

const getKey = (config?: EncryptionConfig): Promise<CryptoKey> => {
  if (config?.key) {
    return Promise.resolve(config.key);
  }
  return importMasterKey();
};

const randomIv = (): Uint8Array => {
  const iv = new Uint8Array(12);
  getCrypto().getRandomValues(iv);
  return iv;
};

export const encryptString = async (plain: string, config?: EncryptionConfig): Promise<EncryptedPayload> => {
  const key = await getKey(config);
  const iv = randomIv();
  const data = textEncoder.encode(plain);
  const cipherBuffer = await getCryptoSubtle().encrypt({ name: "AES-GCM", iv }, key, data);
  return {
    version: ENCRYPTION_VERSION,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(cipherBuffer),
  };
};

export const decryptString = async (payload: EncryptedPayload, config?: EncryptionConfig): Promise<string> => {
  if (!payload?.iv || !payload?.ciphertext) {
    throw new Error("El payload cifrado es inválido.");
  }
  const key = await getKey(config);
  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);
  const plainBuffer = await getCryptoSubtle().decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return textDecoder.decode(plainBuffer);
};

export const encryptJSON = async <T>(value: T, config?: EncryptionConfig): Promise<EncryptedPayload> => {
  return encryptString(JSON.stringify(value), config);
};

export const decryptJSON = async <T>(payload: EncryptedPayload, config?: EncryptionConfig): Promise<T> => {
  const raw = await decryptString(payload, config);
  return JSON.parse(raw) as T;
};

export const encryptArrayBuffer = async (buffer: ArrayBuffer, config?: EncryptionConfig): Promise<EncryptedPayload> => {
  const key = await getKey(config);
  const iv = randomIv();
  const cipherBuffer = await getCryptoSubtle().encrypt({ name: "AES-GCM", iv }, key, buffer);
  return {
    version: ENCRYPTION_VERSION,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(cipherBuffer),
  };
};

export const decryptArrayBuffer = async (payload: EncryptedPayload, config?: EncryptionConfig): Promise<ArrayBuffer> => {
  const key = await getKey(config);
  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);
  return getCryptoSubtle().decrypt({ name: "AES-GCM", iv }, key, ciphertext);
};
