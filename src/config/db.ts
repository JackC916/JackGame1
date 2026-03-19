import mongoose from "mongoose";

export async function connectMongo() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("Missing env var: MONGODB_URI");

  const dbName = process.env.MONGODB_DB ?? "jackGame";

  // Note: `dbName` is the database portion used by the connection, so it
  // lets us keep `MONGODB_URI` in a common format.
  await mongoose.connect(mongoUri, { dbName });
}

