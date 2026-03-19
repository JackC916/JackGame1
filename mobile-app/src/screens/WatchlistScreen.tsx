import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  DEFAULT_USER_ID,
  fetchWatchlistMovies,
  getHiResPosterUrl,
  Movie,
} from "../lib/api";
import { Colors, GlobalStyles, Typography } from "../theme/GlobalStyles";

function getCleanSynopsis(text: string | null | undefined): string {
  if (!text) return "No synopsis available.";
  const normalized = text.replace(/\s*View Full Synopsis\s*/i, " ").trim();
  const noEllipsis = normalized.replace(/\.\.\.+/g, ".").trim();
  const periodIndex = noEllipsis.indexOf(".");
  if (periodIndex >= 0) {
    const firstSentence = noEllipsis.slice(0, periodIndex + 1).trim();
    return firstSentence || "No synopsis available.";
  }
  return noEllipsis;
}

function WatchlistCard({
  movie,
  onPress,
}: {
  movie: Movie;
  onPress: () => void;
}) {
  const hiResPosterUrl = getHiResPosterUrl(movie.posterImageUrl);
  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityLabel="Open movie synopsis"
    >
      <ImageBackground
        source={hiResPosterUrl ? { uri: hiResPosterUrl } : undefined}
        style={styles.poster}
        imageStyle={styles.posterImage}
      />
      <Text style={[GlobalStyles.textBase, styles.title]} numberOfLines={2}>
        {movie.title ?? "Untitled"}
      </Text>
    </Pressable>
  );
}

export default function WatchlistScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

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
        <Text style={GlobalStyles.textBase}>Loading watchlist...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={movies}
        numColumns={2}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <WatchlistCard movie={item} onPress={() => setSelectedMovie(item)} />
        )}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.column}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={GlobalStyles.textBase}>No liked movies yet.</Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedMovie}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMovie(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedMovie(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              {selectedMovie?.title ?? "Untitled"}
            </Text>
            <Text style={styles.modalYear}>
              {selectedMovie?.year ?? "Unknown year"}
            </Text>
            <Text style={styles.modalSynopsis}>
              {getCleanSynopsis(selectedMovie?.description)}
            </Text>

            <TouchableOpacity
              style={[GlobalStyles.buttonPrimary, styles.modalButton]}
              onPress={() => setSelectedMovie(null)}
            >
              <Text style={[GlobalStyles.textBase, styles.closeButtonText]}>
                Close
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
    paddingBottom: 8,
  },
  poster: {
    aspectRatio: 2 / 3,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  posterImage: {
    borderRadius: 24,
    resizeMode: "cover",
  },
  title: {
    marginTop: 8,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.baseFontSize,
    lineHeight: Typography.lineHeightBase,
    fontWeight: "600",
    paddingHorizontal: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent,
    padding: 18,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.headerFontSize,
    lineHeight: Typography.lineHeightHeader,
    fontWeight: "700",
  },
  modalYear: {
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.baseFontSize,
    lineHeight: Typography.lineHeightBase,
    marginTop: 4,
    marginBottom: 12,
  },
  modalSynopsis: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.baseFontSize,
    lineHeight: Typography.lineHeightBase,
  },
  modalButton: {
    marginTop: 16,
  },
  closeButtonText: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
});

