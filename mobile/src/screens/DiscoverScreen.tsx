import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { Heart, X } from "lucide-react-native";
import {
  DEFAULT_USER_ID,
  fetchUnswipedMovies,
  Movie,
  postSwipe,
} from "../lib/api";

function MovieCard({ movie }: { movie: Movie }) {
  const imageSource = movie.posterImageUrl
    ? { uri: movie.posterImageUrl }
    : undefined;

  return (
    <View style={styles.card}>
      <ImageBackground
        source={imageSource}
        style={styles.cardImage}
        imageStyle={styles.cardImageInner}
      >
        <View style={styles.overlay}>
          <Text style={styles.titleText} numberOfLines={2}>
            {movie.title ?? "Untitled"}
          </Text>
          <Text style={styles.yearText}>{movie.year ?? "Unknown year"}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

export default function DiscoverScreen() {
  const swiperRef = useRef<Swiper<Movie>>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cardIndex, setCardIndex] = useState<number>(0);

  const loadMovies = useCallback(async () => {
    try {
      setLoading(true);
      const nextMovies = await fetchUnswipedMovies(DEFAULT_USER_ID);
      setMovies(nextMovies);
      setCardIndex(0);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error while loading movies";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadMovies();
  }, [loadMovies]);

  const currentMovie = useMemo(() => movies[cardIndex] ?? null, [movies, cardIndex]);

  const handleSwipe = useCallback(
    async (index: number, type: "like" | "dislike") => {
      const movie = movies[index];
      if (!movie?._id) return;
      try {
        await postSwipe({ userId: DEFAULT_USER_ID, movieId: movie._id, type });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error while saving swipe";
        Alert.alert("Swipe Error", message);
      }
    },
    [movies]
  );

  const handleSwipedAll = useCallback(() => {
    void loadMovies();
  }, [loadMovies]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.helperText}>Loading movies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {movies.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.helperText}>No unswiped movies left.</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadMovies}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Swiper
            ref={swiperRef}
            cards={movies}
            cardIndex={cardIndex}
            renderCard={(movie) => <MovieCard movie={movie} />}
            onSwiped={(index) => setCardIndex(index + 1)}
            onSwipedRight={(index) => {
              void handleSwipe(index, "like");
            }}
            onSwipedLeft={(index) => {
              void handleSwipe(index, "dislike");
            }}
            onSwipedAll={handleSwipedAll}
            backgroundColor="transparent"
            stackSize={3}
            stackSeparation={14}
            disableTopSwipe
            disableBottomSwipe
            verticalSwipe={false}
            animateOverlayLabelsOpacity
            cardVerticalMargin={20}
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => swiperRef.current?.swipeLeft()}
              accessibilityLabel="Dislike movie"
            >
              <X size={26} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              onPress={() => swiperRef.current?.swipeRight()}
              accessibilityLabel="Like movie"
            >
              <Heart size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {currentMovie ? (
            <Text style={styles.helperTextBottom}>
              Swiping: {currentMovie.title ?? "Untitled"}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F16",
    paddingTop: 18,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  cardImage: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#1F2937",
  },
  cardImageInner: {
    resizeMode: "cover",
  },
  overlay: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  yearText: {
    marginTop: 4,
    color: "#D1D5DB",
    fontSize: 16,
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 14,
    marginBottom: 8,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  likeButton: {
    backgroundColor: "#10B981",
  },
  helperText: {
    color: "#9CA3AF",
    fontSize: 16,
  },
  helperTextBottom: {
    textAlign: "center",
    color: "#9CA3AF",
    marginBottom: 10,
  },
  refreshButton: {
    marginTop: 6,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

