const KEY = 'mf-cms-v1';
const TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  data: unknown;
  ts: number;
}

export function readCache(): unknown | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    return entry?.data ?? null;
  } catch {
    return null;
  }
}

export function writeCache(data: unknown): void {
  try {
    const entry: CacheEntry = { data, ts: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    // Storage full or disabled — non-fatal, fallback/snapshot still works.
  }
}

export function cacheAgeMs(): number | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    return entry?.ts ? Date.now() - entry.ts : null;
  } catch {
    return null;
  }
}

export function isCacheStale(): boolean {
  const age = cacheAgeMs();
  return age === null || age > TTL_MS;
}

export function clearCache(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // non-fatal
  }
}
