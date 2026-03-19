import fs from "fs";
import path from "path";
import "dotenv/config";
import { scrapeTop100FromRottenTomatoes } from "./scrapeRottenTomatoes";
import { upsertMoviesToMongo } from "./mongoUpsert";
import type { MovieSeed } from "./types";

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function main() {
  const mongoUri = mustGetEnv("MONGODB_URI");
  const mongoDb = process.env.MONGODB_DB ?? "jackGame";
  const mongoCollection = process.env.MONGODB_COLLECTION ?? "movies";

  const movies: MovieSeed[] = await scrapeTop100FromRottenTomatoes();

  const outPath = path.join(process.cwd(), "movies_seed.json");
  fs.writeFileSync(outPath, JSON.stringify(movies, null, 2), "utf8");
  console.log(`Wrote ${movies.length} movies to ${outPath}`);

  await upsertMoviesToMongo({
    mongoUri,
    dbName: mongoDb,
    collectionName: mongoCollection,
    movies,
  });

  console.log(
    `Upserted ${movies.length} movies into MongoDB (${mongoDb}.${mongoCollection}).`
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exitCode = 1;
});

