import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createReport } from "../firestoreService";
import { reportInputSchema, type ReportInput } from "../validation/reportSchema";

const ENCRYPTION_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const OWNER_META = {
  name: "Docente Autorizado",
  email: "docente@institucion.mx",
  role: "teacher" as const,
};

const addDocMock = vi.fn();
const collectionMock = vi.fn();

vi.mock("../../../services/firebase", () => ({
  db: {} as Record<string, never>,
}));

vi.mock("firebase/firestore", () => ({
  Timestamp: {
    now: vi.fn(() => ({
      toDate: () => new Date("2025-01-01T00:00:00.000Z"),
    })),
    fromDate: (date: Date) => ({
      toDate: () => date,
    }),
  },
  collection: (...args: unknown[]) => collectionMock(...args),
  addDoc: (...args: unknown[]) => addDocMock(...args),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getDocs: vi.fn(async () => ({ docs: [] })),
  doc: vi.fn(() => ({})),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

const basePayload: ReportInput = {
  title: "Seguimiento inicial",
  description: "Descripcion valida para el caso de prueba unitario.",
  category: "Seguimiento",
  date: "2025-01-15",
  uid: "user-123",
};

describe("reportInputSchema", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENCRYPTION_MASTER_KEY", ENCRYPTION_KEY);
    addDocMock.mockReset();
    collectionMock.mockReset();
    addDocMock.mockResolvedValue({ id: "test-report" });
    collectionMock.mockReturnValue({});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts a valid payload", () => {
    expect(() => reportInputSchema.parse(basePayload)).not.toThrow();
  });

  it("rejects an invalid payload", () => {
    expect(() =>
      reportInputSchema.parse({
        ...basePayload,
        title: "ab",
      }),
    ).toThrow(/titulo/i);
  });

  it("prevents Firestore writes when validation fails", async () => {
    await expect(
      createReport(
        {
          ...basePayload,
          description: "corta",
        },
        OWNER_META,
      ),
    ).rejects.toThrow(/Datos de reporte invalidos/i);
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it("surfaced Firestore write errors with a readable message", async () => {
    addDocMock.mockRejectedValueOnce(new Error("firestore down"));

    await expect(createReport(basePayload, OWNER_META)).rejects.toThrow(/No se pudo crear el reporte/i);
    expect(addDocMock).toHaveBeenCalledTimes(1);
  });
});
