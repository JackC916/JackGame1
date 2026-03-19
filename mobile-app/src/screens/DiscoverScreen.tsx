import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
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
  getHiResPosterUrl,
  Movie,
  postSwipe,
} from "../lib/api";
import { Colors, GlobalStyles, Typography } from "../theme/GlobalStyles";

function getCleanSynopsis(text: string | null | undefined): string {
  if (!text) return "No synopsis available.";

  // Remove common trailing prompt from source content.
  const normalized = text.replace(/\s*View Full Synopsis\s*/i, " ").trim();

  // Remove literal ellipsis sequences before sentence trimming.
  const noEllipsis = normalized.replace(/\.\.\.+/g, ".").trim();

  // Cut at first sentence-ending period.
  const periodIndex = noEllipsis.indexOf(".");
  if (periodIndex >= 0) {
    const firstSentence = noEllipsis.slice(0, periodIndex + 1).trim();
    return firstSentence || "No synopsis available.";
  }

  return noEllipsis;
}

function MovieCard({
  movie,
  onPress,
}: {
  movie: Movie;
  onPress: () => void;
}) {
  const hiResPosterUrl = getHiResPosterUrl(movie.posterImageUrl);
  const imageSource = hiResPosterUrl
    ? { uri: hiResPosterUrl }
    : undefined;

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityLabel="Open movie synopsis">
      <View style={styles.posterBox}>
        <View style={styles.posterImageWrap}>
          {imageSource ? (
            <Image source={imageSource} style={styles.cardImage} resizeMode="contain" />
          ) : (
            <View style={styles.posterPlaceholder} />
          )}
        </View>
      </View>
      <View style={styles.metaBox}>
        <Text style={[GlobalStyles.textHeader, styles.titleText]} numberOfLines={2}>
          {movie.title ?? "Untitled"}
        </Text>
        <Text style={[GlobalStyles.textBase, styles.yearText]}>
          {movie.year ?? "Unknown year"}
        </Text>
      </View>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const swiperRef = useRef<Swiper<Movie>>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

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
        <Text style={GlobalStyles.textBase}>Loading movies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {movies.length === 0 ? (
        <View style={styles.centered}>
          <Text style={GlobalStyles.textBase}>No unswiped movies left.</Text>
          <TouchableOpacity
            style={[GlobalStyles.buttonPrimary, styles.refreshButton]}
            onPress={loadMovies}
          >
            <Text style={[GlobalStyles.textBase, styles.refreshButtonText]}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.deckArea}>
            <Swiper
              ref={swiperRef}
              cards={movies}
              cardIndex={cardIndex}
              renderCard={(movie) => (
                <MovieCard movie={movie} onPress={() => setSelectedMovie(movie)} />
              )}
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
              cardVerticalMargin={14}
            />
          </View>

          <View style={styles.footerArea}>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => swiperRef.current?.swipeLeft()}
                accessibilityLabel="Dislike movie"
              >
                <X size={26} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, GlobalStyles.buttonPrimary, styles.likeButton]}
                onPress={() => swiperRef.current?.swipeRight()}
                accessibilityLabel="Like movie"
              >
                <Heart size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {currentMovie ? (
              <View style={styles.swipingPill}>
                <Text style={styles.swipingLabel}>Now Swiping</Text>
                <Text style={styles.swipingTitle} numberOfLines={1}>
                  {currentMovie.title ?? "Untitled"}
                </Text>
              </View>
            ) : null}
          </View>

          <Modal
            visible={!!selectedMovie}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedMovie(null)}
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setSelectedMovie(null)}
            >
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
                  <Text style={[GlobalStyles.textBase, styles.refreshButtonText]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 18,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  deckArea: {
    flex: 1,
    paddingHorizontal: 12,
  },
  footerArea: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
    padding: 14,
    justifyContent: "center",
  },
  posterBox: {
    alignSelf: "center",
    width: "92%",
    aspectRatio: 2 / 3,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  posterImageWrap: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.background,
    alignSelf: "center",
  },
  posterPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.background,
  },
  metaBox: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  titleText: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.headerFontSize,
    lineHeight: Typography.lineHeightHeader,
  },
  yearText: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.baseFontSize,
    lineHeight: Typography.lineHeightBase,
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 4,
    marginBottom: 10,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButton: {
    backgroundColor: "#A43B3E",
  },
  likeButton: {
    backgroundColor: Colors.accent,
  },
  swipingPill: {
    alignSelf: "center",
    maxWidth: "88%",
    minWidth: "55%",
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  swipingLabel: {
    color: Colors.accent,
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 2,
  },
  swipingTitle: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.baseFontSize,
    lineHeight: Typography.lineHeightBase,
    textAlign: "center",
    fontWeight: "700",
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
  refreshButton: {
    marginTop: 6,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  refreshButtonText: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
});

