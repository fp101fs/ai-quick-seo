// Tiny in-memory TTL cache. No database yet — results are recomputed on
// demand when an entry expires or the serverless instance recycles.

interface Entry {
  value: unknown;
  expiresAt: number;
}

const globalStore = globalThis as unknown as {
  __seoStore?: Map<string, Entry>;
};

const store: Map<string, Entry> = globalStore.__seoStore ?? new Map();
globalStore.__seoStore = store;

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  compute: () => Promise<T>
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await compute();
  cacheSet(key, value, ttlMs);
  return value;
}
