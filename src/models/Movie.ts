import { Schema, model } from "mongoose";

export type MovieDocument = {
  title: string;
  year: number | null;
  posterImageUrl: string | null;
  description: string | null;
  rating: string | null;
  source: string;
  sourceUrl: string;
};

const movieSchema = new Schema<MovieDocument>(
  {
    title: { type: String, required: true, trim: true },
    year: { type: Number, required: false, default: null },
    posterImageUrl: { type: String, required: false, default: null },
    description: { type: String, required: false, default: null },
    rating: { type: String, required: false, default: null },

    // Provenance fields (helps with deduping)
    source: { type: String, required: true, index: true },
    sourceUrl: { type: String, required: true },
  },
  { timestamps: true }
);

// No unique constraint: we upsert using source/title/year (or source/title if
// year is missing) in the import script.
movieSchema.index({ source: 1, title: 1, year: 1 });

export const Movie = model<MovieDocument>("Movie", movieSchema);

