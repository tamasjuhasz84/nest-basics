import mongoose from "mongoose";

export const name = "002-backfill-done-default";

export async function up() {
  await mongoose.connection
    .collection("items")
    .updateMany(
      { done: { $exists: false } },
      { $set: { done: false, updatedAt: new Date() } },
    );
}
