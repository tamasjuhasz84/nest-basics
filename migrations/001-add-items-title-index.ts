import { db } from "../scripts/_lib/connection";

export const name = "001-add-items-title-index";

export async function up() {
  await db().collection("items").createIndex({ title: 1 });
}
