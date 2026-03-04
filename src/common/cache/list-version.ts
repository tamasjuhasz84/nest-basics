import type { Cache } from "cache-manager";
import { cacheKeys } from "./cache-keys";

async function atomicRedisIncr(
  cache: Cache,
  key: string,
): Promise<number | null> {
  const anyCache = cache as any;

  const stores = [
    anyCache?.store,
    ...(Array.isArray(anyCache?.stores) ? anyCache.stores : []),
  ].filter(Boolean);

  for (const store of stores) {
    const client =
      (typeof store.getClient === "function" ? store.getClient() : undefined) ??
      store.client;

    if (client && typeof client.incr === "function") {
      const next = await client.incr(key);
      const num = Number(next);
      return Number.isFinite(num) ? num : null;
    }

    if (typeof store.incr === "function") {
      const next = await store.incr(key);
      const num = Number(next);
      return Number.isFinite(num) ? num : null;
    }
  }

  return null;
}

export async function getListVersion(cache: Cache): Promise<number> {
  const key = cacheKeys.itemsListVersion();
  const v = await cache.get<number>(key);

  if (typeof v === "number" && Number.isFinite(v)) return v;

  await cache.set(key, 1);
  return 1;
}

export async function bumpListVersion(cache: Cache): Promise<number> {
  const key = cacheKeys.itemsListVersion();

  const atomic = await atomicRedisIncr(cache, key);
  if (atomic !== null) return atomic;

  const current = await getListVersion(cache);
  const next = current + 1;
  await cache.set(key, next);
  return next;
}
