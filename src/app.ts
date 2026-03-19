import express from "express";
import cors from "cors";
import moviesRoutes from "./routes/movies";
import swipeRoutes from "./routes/swipes";
import watchlistRoutes from "./routes/watchlist";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/movies", moviesRoutes);
app.use("/swipe", swipeRoutes);
app.use("/watchlist", watchlistRoutes);

export default app;

