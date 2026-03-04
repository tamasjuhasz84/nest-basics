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
      title: "Seed: Alpha",
      description: "Seeded item",
      done: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: "Seed: Beta",
      description: "Seeded item",
      done: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const doc of seedDocs) {
    await items.updateOne(
      { title: doc.title },
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
