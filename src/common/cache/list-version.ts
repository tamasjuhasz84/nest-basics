import type { Cache } from "cache-manager";
import { cacheKeys } from "./cache-keys";

export async function getListVersion(cache: Cache): Promise<number> {
  const key = cacheKeys.itemsListVersion();
  const v = await cache.get<number>(key);

  if (typeof v === "number" && Number.isFinite(v)) return v;

  await cache.set(key, 1);
  return 1;
}

export async function bumpListVersion(cache: Cache): Promise<number> {
  const key = cacheKeys.itemsListVersion();
  const current = await getListVersion(cache);
  const next = current + 1;
  await cache.set(key, next);
  return next;
}
