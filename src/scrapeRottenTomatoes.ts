import axios from "axios";
import * as cheerio from "cheerio";
import type { MovieSeed } from "./types";

const SCRAPE_URL =
  process.env.SCRAPE_URL ??
  "https://editorial.rottentomatoes.com/guide/best-movies-21st-century/";

const MAX_ITEMS = 100;

// IMPORTANT:
// The initial selectors you gave (`div.row.countdown-item`, etc.) don't match
// the HTML structure returned by Axios+Cheerio in your environment.
// On this page, movie entries are grouped into blocks containing the poster,
// synopsis (includes `Synopsis:`), and Tomatometer rating.
const blockSelector = ".block-countdown";

function stripParensToYear(raw: string): number | null {
  const cleaned = raw.replace(/[()]/g, "").trim();
  if (!cleaned) return null;
  const n = Number.parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : null;
}

function stripSynopsisPrefix(raw: string): string {
  return raw.replace(/^Synopsis:\s*/i, "").trim();
}

function resolveUrl(maybeUrl: string | null, base: string): string | null {
  if (!maybeUrl) return null;
  try {
    return new URL(maybeUrl, base).href;
  } catch {
    return null;
  }
}

function parseTitleYearFromBlockText(blockText: string): {
  title: string | null;
  year: number | null;
} {
  // Example seen on the page: "#1 Parasite (2019)"
  const t = blockText.replace(/\s+/g, " ").trim();
  const m = t.match(/#\s*\d+\s+(.+?)\s*\(\s*(\d{4})\s*\)/);
  if (!m) return { title: null, year: null };
  return { title: m[1].trim(), year: Number(m[2]) };
}

function parseSynopsisFromBlockText(blockText: string): string | null {
  // The page is structured like: "Synopsis: <text> Starring: ... Directed By: ..."
  // We capture non-greedily until the next section header.
  const t = blockText.replace(/\s+/g, " ").trim();
  const m = t.match(/Synopsis:\s*(.+?)(?:\s+Starring:\s*|\s+Directed By:\s*|$)/i);
  if (!m) return null;
  return m[1].trim() || null;
}

function parseRatingFromBlockText(blockText: string): string | null {
  // Typical format in text: "Tomatometer icon 99% Popcornmeter icon 90%"
  const t = blockText.replace(/\s+/g, " ").trim();
  // Use a wider window because the text may include extra tokens/icons.
  const m = t.match(/Tomatometer[\s\S]{0,500}?(\d{1,3})\s*%/i);
  return m ? `${m[1]}%` : null;
}

function extractRatingFromBlock(
  block: cheerio.Cheerio,
  blockText: string
): string | null {
  // Prefer direct extraction if the rating value is present in a span.
  const directText =
    block.find("span.tomatometer-value").first().text().trim() ||
    block
      .find("[class*=tomatometer-value]")
      .first()
      .text()
      .trim();

  if (directText) {
    const m = directText.match(/(\d{1,3})\s*%/);
    if (m) return `${m[1]}%`;
  }

  // Fallback to parsing from the whole block text.
  return parseRatingFromBlockText(blockText);
}

export async function scrapeTop100FromRottenTomatoes(): Promise<MovieSeed[]> {
  const sourceHost = process.env.SOURCE_HOST ?? new URL(SCRAPE_URL).hostname;
  const base = new URL(SCRAPE_URL).origin;

  const res = await axios.get(SCRAPE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    timeout: 30_000,
  });

  const $ = cheerio.load(res.data);

  const movies: MovieSeed[] = [];

  const blocks = $(blockSelector).toArray();
  for (let idx = 0; idx < blocks.length && movies.length < MAX_ITEMS; idx++) {
    const block = $(blocks[idx]);

    // Only consider blocks that look like movie entries.
    const blockTextRaw = block.text();
    if (!/Synopsis:/i.test(blockTextRaw)) continue;

    const posterEl = block.find("img.article_poster").first();
    const posterSrc = posterEl.attr("src") ?? posterEl.attr("data-src") ?? null;
    const posterImageUrl = resolveUrl(posterSrc, base);

    const blockText = blockTextRaw.replace(/\s+/g, " ").trim();

    const { title, year } = parseTitleYearFromBlockText(blockText);
    if (!title) continue;

    const description = parseSynopsisFromBlockText(blockText);
    const rating = extractRatingFromBlock(block, blockText);

    // Basic error handling for missing fields.
    if (year === null) console.warn(`Movie "${title}": missing/invalid year`);
    if (!description)
      console.warn(`Movie "${title}": missing synopsis/description`);
    if (!posterImageUrl)
      console.warn(`Movie "${title}": missing poster image url`);
    if (!rating) console.warn(`Movie "${title}": missing rating`);

    movies.push({
      title,
      year,
      posterImageUrl,
      description: description ? stripSynopsisPrefix(description) : null,
      rating,
      source: sourceHost,
      sourceUrl: SCRAPE_URL,
    });
  }

  return movies;
}

