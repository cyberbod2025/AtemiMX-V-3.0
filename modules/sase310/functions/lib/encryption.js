const { webcrypto } = require("crypto");

const ENCRYPTION_VERSION = 1;
const KEY_ENV = "ENCRYPTION_MASTER_KEY_B64";

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

const getSubtle = () => {
  if (!webcrypto?.subtle) {
    throw new Error("WebCrypto no disponible en el entorno de Cloud Functions.");
  }
  return webcrypto.subtle;
};

let cachedKeyPromise = null;

const getMasterKey = () => {
  if (cachedKeyPromise) {
    return cachedKeyPromise;
  }
  const base64Key = process.env[KEY_ENV];
  if (!base64Key) {
    throw new Error(`Falta la variable de entorno ${KEY_ENV} para descifrar reportes.`);
  }
  const rawKey = Buffer.from(base64Key.trim(), "base64");
  cachedKeyPromise = getSubtle().importKey("raw", rawKey, "AES-GCM", false, ["encrypt", "decrypt"]);
  return cachedKeyPromise;
};

const decodeBase64 = (value) => Buffer.from(value, "base64");
const encodeBase64 = (value) => Buffer.from(value).toString("base64");

const randomIv = () => {
  const iv = new Uint8Array(12);
  webcrypto.getRandomValues(iv);
  return iv;
};

const decryptPayload = async (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload cifrado inválido.");
  }
  if (typeof payload.iv !== "string" || typeof payload.ciphertext !== "string") {
    throw new Error("Payload cifrado incompleto.");
  }
  if (payload.version !== ENCRYPTION_VERSION) {
    throw new Error(`Version de cifrado no soportada: ${payload.version}`);
  }
  const key = await getMasterKey();
  const iv = decodeBase64(payload.iv);
  const ciphertext = decodeBase64(payload.ciphertext);
  const plainBuffer = await getSubtle().decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  const text = textDecoder.decode(plainBuffer);
  return JSON.parse(text);
};

const encryptPayload = async (data) => {
  const key = await getMasterKey();
  const iv = randomIv();
  const plainBuffer = textEncoder.encode(JSON.stringify(data));
  const cipherBuffer = await getSubtle().encrypt({ name: "AES-GCM", iv }, key, plainBuffer);
  return {
    version: ENCRYPTION_VERSION,
    iv: encodeBase64(iv),
    ciphertext: encodeBase64(cipherBuffer),
  };
};

module.exports = {
  decryptPayload,
  encryptPayload,
};
