import { Router } from "express";
import mongoose, { Types } from "mongoose";
import { Swipe } from "../models/Swipe";

const router = Router();

// POST /swipe
// Body: { userId: string, movieId: string (ObjectId), type: 'like'|'dislike' }
router.post("/", async (req, res) => {
  try {
    const { userId, movieId, type } = req.body ?? {};

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing/invalid userId" });
    }
    if (!movieId || typeof movieId !== "string") {
      return res.status(400).json({ error: "Missing/invalid movieId" });
    }
    if (type !== "like" && type !== "dislike") {
      return res.status(400).json({ error: "type must be 'like' or 'dislike'" });
    }

    if (!Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ error: "movieId is not a valid ObjectId" });
    }

    const movieObjectId = new Types.ObjectId(movieId);

    const swipe = await Swipe.findOneAndUpdate(
      { userId, movieId: movieObjectId },
      { $set: { type } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        context: "query",
      }
    ).lean();

    return res.status(200).json({ swipe });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
});

export default router;

