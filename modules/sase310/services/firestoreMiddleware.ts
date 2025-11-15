import { getDoc, type DocumentReference, type DocumentSnapshot } from "firebase/firestore";

const DEFAULT_TTL_MS = 20_000;

interface CacheEntry {
  timestamp: number;
  snapshot: DocumentSnapshot | null;
  inflight?: Promise<DocumentSnapshot>;
}

const cache = new Map<string, CacheEntry>();

const isFresh = (entry: CacheEntry | undefined, ttl: number) => {
  if (!entry || !entry.snapshot) {
    return false;
  }
  return Date.now() - entry.timestamp <= ttl;
};

const toKey = (refOrPath: DocumentReference | string) => (typeof refOrPath === "string" ? refOrPath : refOrPath.path);

export const getDocCached = async <T>(
  ref: DocumentReference<T>,
  options?: { ttlMs?: number; bypassCache?: boolean },
): Promise<DocumentSnapshot<T>> => {
  const key = ref.path;
  const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;
  const entry = cache.get(key);

  if (!options?.bypassCache && isFresh(entry, ttl) && entry?.snapshot) {
    return entry.snapshot as DocumentSnapshot<T>;
  }

  if (entry?.inflight) {
    return entry.inflight as Promise<DocumentSnapshot<T>>;
  }

  const inflight = getDoc(ref);
  cache.set(key, { timestamp: Date.now(), snapshot: null, inflight });
  const snapshot = await inflight;
  cache.set(key, { timestamp: Date.now(), snapshot });
  return snapshot;
};

export const primeDocCache = <T>(ref: DocumentReference<T>, snapshot: DocumentSnapshot<T>) => {
  cache.set(ref.path, { timestamp: Date.now(), snapshot });
};

export const invalidateDocCache = (refOrPath: DocumentReference | string) => {
  cache.delete(toKey(refOrPath));
};
