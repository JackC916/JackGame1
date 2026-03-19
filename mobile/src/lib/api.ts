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

