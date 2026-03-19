import { Platform } from "react-native";

export type Movie = {
  _id: string;
  title: string | null;
  year: number | null;
  posterImageUrl: string | null;
  description: string | null;
  rating: string | null;
};

const API_BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://localhost:3000";

export const DEFAULT_USER_ID = "demo-user-1";

export function getHiResPosterUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Rotten Tomatoes / Flixster poster URLs commonly include:
  // .../fit-in/180x240/...
  // We double those dimensions to request a higher-resolution asset.
  return url.replace(/\/fit-in\/(\d+)x(\d+)\//, (_match, w, h) => {
    const width = Number.parseInt(w, 10);
    const height = Number.parseInt(h, 10);
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      return `/fit-in/${w}x${h}/`;
    }
    return `/fit-in/${width * 2}x${height * 2}/`;
  });
}

export async function fetchUnswipedMovies(userId: string): Promise<Movie[]> {
  const res = await fetch(`${API_BASE_URL}/movies/unswiped/${userId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch unswiped movies. Status: ${res.status}`);
  }

  const data = (await res.json()) as { movies?: Movie[] };
  return Array.isArray(data.movies) ? data.movies : [];
}

export async function fetchWatchlistMovies(userId: string): Promise<Movie[]> {
  const res = await fetch(`${API_BASE_URL}/watchlist/${userId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch watchlist. Status: ${res.status}`);
  }

  const data = (await res.json()) as { movies?: Movie[] };
  return Array.isArray(data.movies) ? data.movies : [];
}

export async function postSwipe(params: {
  userId: string;
  movieId: string;
  type: "like" | "dislike";
}) {
  const { userId, movieId, type } = params;
  const res = await fetch(`${API_BASE_URL}/swipe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, movieId, type }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to save swipe (${res.status}): ${text}`);
  }
}

