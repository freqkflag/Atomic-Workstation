const cache = new Map<string, { value: unknown; expires: number }>();

export function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCache(key: string, value: unknown, ttlMs = 60_000): void {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}

export function cacheStats() {
  return { size: cache.size };
}
