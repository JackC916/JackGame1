export type MovieSeed = {
  title: string | null;
  year: number | null;
  posterImageUrl: string | null;
  description: string | null; // synopsis without "Synopsis: "
  rating: string | null; // tomatometer value

  // Stored for provenance/deduping
  source: string;
  sourceUrl: string;
};

