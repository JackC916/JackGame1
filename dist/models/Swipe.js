"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Swipe = void 0;
const mongoose_1 = require("mongoose");
const swipeSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    movieId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Movie", required: true },
    type: { type: String, enum: ["like", "dislike"], required: true },
}, { timestamps: true });
// Ensure a user can swipe the same movie only once.
swipeSchema.index({ userId: 1, movieId: 1 }, { unique: true });
exports.Swipe = (0, mongoose_1.model)("Swipe", swipeSchema);
