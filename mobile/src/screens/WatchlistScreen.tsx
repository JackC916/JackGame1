import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DEFAULT_USER_ID, fetchWatchlistMovies, Movie } from "../lib/api";

function WatchlistCard({ movie }: { movie: Movie }) {
  return (
    <View style={styles.card}>
      <ImageBackground
        source={movie.posterImageUrl ? { uri: movie.posterImageUrl } : undefined}
        style={styles.poster}
        imageStyle={styles.posterImage}
      />
      <Text style={styles.title} numberOfLines={2}>
        {movie.title ?? "Untitled"}
      </Text>
    </View>
  );
}

export default function WatchlistScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadWatchlist = useCallback(async () => {
    try {
      const data = await fetchWatchlistMovies(DEFAULT_USER_ID);
      setMovies(data);
    } catch {
      setMovies([]);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadWatchlist();
      setLoading(false);
    };
    void run();
  }, [loadWatchlist]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWatchlist();
    setRefreshing(false);
  }, [loadWatchlist]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.helperText}>Loading watchlist...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={movies}
        numColumns={2}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <WatchlistCard movie={item} />}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.column}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.helperText}>No liked movies yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F16",
  },
  listContainer: {
    padding: 12,
    paddingBottom: 28,
  },
  column: {
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    marginBottom: 14,
  },
  poster: {
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1F2937",
  },
  posterImage: {
    borderRadius: 12,
    resizeMode: "cover",
  },
  title: {
    marginTop: 8,
    color: "#F3F4F6",
    fontSize: 14,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    marginTop: 8,
    color: "#9CA3AF",
  },
});

