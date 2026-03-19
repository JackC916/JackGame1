import { Schema, model, Types } from "mongoose";

export type SwipeType = "like" | "dislike";

export type SwipeDocument = {
  userId: string;
  movieId: Types.ObjectId;
  type: SwipeType;
};

const swipeSchema = new Schema<SwipeDocument>(
  {
    userId: { type: String, required: true, index: true },
    movieId: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
    type: { type: String, enum: ["like", "dislike"], required: true },
  },
  { timestamps: true }
);

// Ensure a user can swipe the same movie only once.
swipeSchema.index({ userId: 1, movieId: 1 }, { unique: true });

export const Swipe = model<SwipeDocument>("Swipe", swipeSchema);

