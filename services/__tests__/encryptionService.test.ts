import { describe, expect, it } from "vitest";
import {
  decryptArrayBuffer,
  decryptJSON,
  decryptString,
  encryptArrayBuffer,
  encryptJSON,
  encryptString,
  type EncryptionConfig,
} from "../encryptionService";

const TEST_VECTOR = new Uint8Array(
  Array.from({ length: 32 }, (_, idx) => (idx * 13 + 37) % 256),
);

const getTestConfig = async (): Promise<EncryptionConfig> => {
  const key = await crypto.subtle.importKey("raw", TEST_VECTOR, "AES-GCM", false, ["encrypt", "decrypt"]);
  return { key };
};

describe("encryptionService AES-GCM helper", () => {
  it("cifra y descifra strings preservando el contenido", async () => {
    const config = await getTestConfig();
    const message = "NEM:AtemiMX#Guardian";

    const encrypted = await encryptString(message, config);
    expect(encrypted.version).toBe(1);
    expect(encrypted.iv).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);

    const decrypted = await decryptString(encrypted, config);
    expect(decrypted).toBe(message);
  });

  it("genera IVs diferentes para mensajes consecutivos", async () => {
    const config = await getTestConfig();
    const first = await encryptString("alpha", config);
    const second = await encryptString("beta", config);
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it("serializa objetos JSON y los recupera sin pérdida", async () => {
    const config = await getTestConfig();
    const payload = { phase: 3, scope: ["projects", "tasks"], strict: true };

    const encrypted = await encryptJSON(payload, config);
    const decrypted = await decryptJSON<typeof payload>(encrypted, config);

    expect(decrypted).toEqual(payload);
  });

  it("protege ArrayBuffer y permite reconstruirlo", async () => {
    const config = await getTestConfig();
    const plain = new TextEncoder().encode("GuardianAudit::Buffer").buffer;

    const encrypted = await encryptArrayBuffer(plain, config);
    const decryptedBuffer = await decryptArrayBuffer(encrypted, config);

    expect(new Uint8Array(decryptedBuffer)).toEqual(new Uint8Array(plain));
  });

  it("rechaza payloads inválidos al intentar descifrar", async () => {
    const config = await getTestConfig();
    const invalidPayload = { version: 1, iv: "", ciphertext: "" };

    await expect(decryptString(invalidPayload, config)).rejects.toThrow(/inválido/i);
  });
});
