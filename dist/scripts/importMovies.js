"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("../config/db");
const Movie_1 = require("../models/Movie");
function buildFilter(m) {
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
    await (0, db_1.connectMongo)();
    await Movie_1.Movie.init(); // ensure model indexes are ready
    const jsonPath = path_1.default.join(process.cwd(), "movies_seed.json");
    if (!fs_1.default.existsSync(jsonPath)) {
        throw new Error(`movies_seed.json not found at: ${jsonPath}`);
    }
    const raw = fs_1.default.readFileSync(jsonPath, "utf8");
    const movies = JSON.parse(raw);
    if (!Array.isArray(movies)) {
        throw new Error("movies_seed.json must contain an array");
    }
    const now = new Date();
    const filtered = movies.filter((m) => typeof m.title === "string" && m.title.trim().length > 0);
    const defaultSourceUrl = process.env.SCRAPE_URL ??
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
        console.warn(`Skipped ${movies.length - filtered.length} items without a valid title.`);
    }
    const result = await Movie_1.Movie.collection.bulkWrite(ops, { ordered: false });
    console.log(`Import complete. upserted=${result.upsertedCount}, matched=${result.matchedCount}, modified=${result.modifiedCount}`);
    await mongoose_1.default.connection.close();
}
main().catch((err) => {
    console.error("Import failed:", err?.message ?? err);
    process.exitCode = 1;
});
