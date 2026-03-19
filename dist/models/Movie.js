"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Movie = void 0;
const mongoose_1 = require("mongoose");
const movieSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    year: { type: Number, required: false, default: null },
    posterImageUrl: { type: String, required: false, default: null },
    description: { type: String, required: false, default: null },
    rating: { type: String, required: false, default: null },
    // Provenance fields (helps with deduping)
    source: { type: String, required: true, index: true },
    sourceUrl: { type: String, required: true },
}, { timestamps: true });
// No unique constraint: we upsert using source/title/year (or source/title if
// year is missing) in the import script.
movieSchema.index({ source: 1, title: 1, year: 1 });
exports.Movie = (0, mongoose_1.model)("Movie", movieSchema);
