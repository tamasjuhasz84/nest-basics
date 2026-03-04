import "dotenv/config";
import mongoose from "mongoose";
import { connectDb, disconnectDb } from "./_lib/db";
import { assertSafeToWrite } from "./_lib/guard";

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is required");

  assertSafeToWrite(uri);

  await connectDb(uri);

  const items = mongoose.connection.collection("items");

  const seedDocs = [
    {
      name: "Seed: Alpha",
      done: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Seed: Beta",
      done: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const doc of seedDocs) {
    await items.updateOne(
      { name: doc.name },
      { $setOnInsert: doc },
      { upsert: true },
    );
  }

  console.log(`Seed OK: upserted ${seedDocs.length} docs (idempotent)`);

  await disconnectDb();
}

seed().catch(async (err) => {
  console.error(err);
  try {
    await disconnectDb();
  } catch {}
  process.exit(1);
});
