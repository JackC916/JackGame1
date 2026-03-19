import "dotenv/config";
import app from "./app";
import { connectMongo } from "./config/db";
import mongoose from "mongoose";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

async function start() {
  await connectMongo();

  const server = app.listen(port, () => {
    console.log(`Server listening on :${port}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    server.close();
    await mongoose.connection.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exitCode = 1;
});

