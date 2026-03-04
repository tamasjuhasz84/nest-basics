import mongoose from "mongoose";

export type Migration = {
  name: string;
  up: () => Promise<void>;
};

export async function hasMigrationRun(name: string) {
  const col = mongoose.connection.collection("migrations");
  const found = await col.findOne({ name });
  return Boolean(found);
}

export async function markMigrationRun(name: string) {
  const col = mongoose.connection.collection("migrations");
  await col.insertOne({ name, appliedAt: new Date() });
}
