"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
require("dotenv/config");
const scrapeRottenTomatoes_1 = require("./scrapeRottenTomatoes");
const mongoUpsert_1 = require("./mongoUpsert");
function mustGetEnv(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`Missing required env var: ${name}`);
    return v;
}
async function main() {
    const mongoUri = mustGetEnv("MONGODB_URI");
    const mongoDb = process.env.MONGODB_DB ?? "jackGame";
    const mongoCollection = process.env.MONGODB_COLLECTION ?? "movies";
    const movies = await (0, scrapeRottenTomatoes_1.scrapeTop100FromRottenTomatoes)();
    const outPath = path_1.default.join(process.cwd(), "movies_seed.json");
    fs_1.default.writeFileSync(outPath, JSON.stringify(movies, null, 2), "utf8");
    console.log(`Wrote ${movies.length} movies to ${outPath}`);
    await (0, mongoUpsert_1.upsertMoviesToMongo)({
        mongoUri,
        dbName: mongoDb,
        collectionName: mongoCollection,
        movies,
    });
    console.log(`Upserted ${movies.length} movies into MongoDB (${mongoDb}.${mongoCollection}).`);
}
main().catch((err) => {
    console.error("Fatal:", err);
    process.exitCode = 1;
});
