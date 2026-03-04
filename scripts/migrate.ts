import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { connectDb, disconnectDb } from "./_lib/db";
import { assertSafeToWrite } from "./_lib/guard";
import { hasMigrationRun, markMigrationRun } from "./_lib/migrations";
import { pathToFileURL } from "node:url";

type MigrationModule = {
  name: string;
  up: () => Promise<void>;
};

async function migrate() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is required");

  assertSafeToWrite(uri);

  await connectDb(uri);

  const migrationsDir = path.resolve(process.cwd(), "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js"))
    .sort();

  for (const file of files) {
    const full = path.join(migrationsDir, file);
    const mod = (await import(pathToFileURL(full).href)) as MigrationModule;

    if (!mod?.name || typeof mod.up !== "function") {
      throw new Error(`Invalid migration module: ${file}`);
    }

    const already = await hasMigrationRun(mod.name);
    if (already) {
      console.log(`skip ${mod.name}`);
      continue;
    }

    console.log(`run  ${mod.name}`);
    await mod.up();
    await markMigrationRun(mod.name);
    console.log(`done ${mod.name}`);
  }

  await disconnectDb();
}

migrate().catch(async (err) => {
  console.error(err);
  try {
    await disconnectDb();
  } catch {}
  process.exit(1);
});
