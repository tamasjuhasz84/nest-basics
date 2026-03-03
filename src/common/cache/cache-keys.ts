import { createHash } from "crypto";

export const cacheKeys = {
  item: (id: string) => `item:${id}`,

  itemsListVersion: () => `items:list:ver`,

  itemsList: (ver: number, query: Record<string, any>) =>
    `items:list:v${ver}:${hashQuery(query)}`,
};

function hashQuery(q: Record<string, any>) {
  const stable = JSON.stringify(sortObject(q));
  return createHash("sha1").update(stable).digest("hex");
}

function sortObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = sortObject(obj[key]);
        return acc;
      }, {});
  }
  return obj;
}
