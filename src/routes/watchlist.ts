import { Router } from "express";
import { Swipe } from "../models/Swipe";
import { Movie } from "../models/Movie";

const router = Router();

// GET /watchlist/:userId
// Returns all movies swiped as "like" by the user.
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const likedSwipes = await Swipe.find(
      { userId, type: "like" },
      { movieId: 1, _id: 0 }
    ).lean();

    const likedMovieIds = likedSwipes.map((s) => s.movieId);
    if (likedMovieIds.length === 0) return res.status(200).json({ movies: [] });

    const movies = await Movie.find({ _id: { $in: likedMovieIds } }).lean();
    return res.status(200).json({ movies });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

export default router;

