import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectMongo } from "../config/db";
import { Movie } from "../models/Movie";

type MovieSeedInput = {
  title: string | null;
  year: number | null;
  posterImageUrl: string | null;
  description: string | null;
  rating: string | null;
  source?: string;
  sourceUrl?: string;
};

function buildFilter(m: MovieSeedInput) {
  const source = m.source ?? "rottentomatoes";
  const title = m.title;
  if (!title) {
    // This shouldn’t happen if the scraper output is sane, but we still
    // must provide a filter.
    return { source };
  }

  // When year is missing, use (source + title) to avoid unique/null-year issues.
  if (m.year === null || typeof m.year !== "number") {
    return { source, title };
  }

  return { source, title, year: m.year };
}

async function main() {
  await connectMongo();
  await Movie.init(); // ensure model indexes are ready

  const jsonPath = path.join(process.cwd(), "movies_seed.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`movies_seed.json not found at: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf8");
  const movies: MovieSeedInput[] = JSON.parse(raw);

  if (!Array.isArray(movies)) {
    throw new Error("movies_seed.json must contain an array");
  }

  const now = new Date();
  const filtered = movies.filter((m) => typeof m.title === "string" && m.title.trim().length > 0);
  const defaultSourceUrl =
    process.env.SCRAPE_URL ??
    "https://editorial.rottentomatoes.com/guide/best-movies-21st-century/";

  const ops = filtered.map((m) => {
    const source = m.source ?? "rottentomatoes";
    const sourceUrl = (m.sourceUrl && typeof m.sourceUrl === "string" ? m.sourceUrl : null) ?? defaultSourceUrl;

    return {
      updateOne: {
        filter: buildFilter(m),
        upsert: true,
        update: {
          $set: {
            title: m.title,
            year: typeof m.year === "number" ? m.year : null,
            posterImageUrl: m.posterImageUrl,
            description: m.description,
            rating: m.rating,
            source,
            sourceUrl,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
      },
    };
  });

  if (filtered.length !== movies.length) {
    console.warn(
      `Skipped ${movies.length - filtered.length} items without a valid title.`
    );
  }

  const result = await Movie.collection.bulkWrite(ops, { ordered: false });
  console.log(
    `Import complete. upserted=${result.upsertedCount}, matched=${result.matchedCount}, modified=${result.modifiedCount}`
  );

  await mongoose.connection.close();
}

main().catch((err) => {
  console.error("Import failed:", err?.message ?? err);
  process.exitCode = 1;
});

