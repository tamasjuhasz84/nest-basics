import { db } from "../scripts/_lib/connection";

export const name = "003-align-items-indexes";

export async function up() {
  const items = db().collection("items");

  const indexes = await items.indexes().catch(() => [] as any[]);
  const legacyTitleIndexes = indexes.filter(
    (idx) =>
      idx?.name === "001-add-items-title-index" || "title" in (idx?.key ?? {}),
  );

  for (const idx of legacyTitleIndexes) {
    await items.dropIndex(idx.name).catch(() => undefined);
  }

  await items.createIndex(
    { done: 1, createdAt: -1 },
    { name: "idx_done_createdAt" },
  );

  await items.createIndex({ createdAt: -1 }, { name: "idx_createdAt_desc" });

  await items.createIndex(
    { name: 1 },
    {
      name: "uniq_name_if_not_done",
      unique: true,
      partialFilterExpression: { done: false },
    },
  );

  await items.createIndex(
    { name: "text" },
    {
      name: "txt_name",
      weights: { name: 10 },
    },
  );
}
