"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertMoviesToMongo = upsertMoviesToMongo;
const mongodb_1 = require("mongodb");
function buildUpsertFilter(movie) {
    // Prefer (source + title + year) as requested.
    // If year is missing, fall back to (source + title) to avoid treating
    // everything with null year as duplicates.
    if (movie.year === null) {
        return { source: movie.source, title: movie.title };
    }
    return { source: movie.source, title: movie.title, year: movie.year };
}
async function upsertMoviesToMongo(params) {
    const { mongoUri, dbName, collectionName, movies } = params;
    if (movies.length === 0)
        return;
    const client = new mongodb_1.MongoClient(mongoUri);
    await client.connect();
    try {
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        // Best-effort unique index to prevent duplicates if the collection
        // is mostly clean already.
        try {
            await collection.createIndex({ source: 1, title: 1, year: 1 }, { unique: true, sparse: true, name: "uniq_source_title_year" });
        }
        catch (e) {
            console.warn(`Unique index creation failed (continuing without it): ${String(e)}`);
            await collection.createIndex({ source: 1, title: 1, year: 1 }, { unique: false, name: "idx_source_title_year" });
        }
        const now = new Date();
        const ops = movies.map((m) => {
            const filter = buildUpsertFilter(m);
            return {
                updateOne: {
                    filter,
                    upsert: true,
                    update: {
                        $set: {
                            title: m.title,
                            year: m.year,
                            posterImageUrl: m.posterImageUrl,
                            description: m.description,
                            rating: m.rating,
                            source: m.source,
                            sourceUrl: m.sourceUrl,
                            updatedAt: now
                        },
                        $setOnInsert: {
                            createdAt: now
                        },
                    },
                },
            };
        });
        await collection.bulkWrite(ops, { ordered: false });
    }
    finally {
        await client.close();
    }
}
