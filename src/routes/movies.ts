import { Router } from "express";
import { Movie } from "../models/Movie";
import { Swipe } from "../models/Swipe";

const router = Router();

// GET /movies/unswiped/:userId
// Returns 10 random movies the user hasn't swiped on yet.
router.get("/unswiped/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const swipes = await Swipe.find(
      { userId },
      { movieId: 1, _id: 0 }
    ).lean();

    const swipedMovieIds = swipes.map((s) => s.movieId);

    const match =
      swipedMovieIds.length > 0
        ? { _id: { $nin: swipedMovieIds } }
        : {};

    const movies = await Movie.aggregate([
      { $match: match },
      { $sample: { size: 10 } },
    ]);

    return res.status(200).json({ movies });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
});

export default router;

