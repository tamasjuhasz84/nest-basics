import mongoose from "mongoose";

export function db() {
  return mongoose.connection;
}
