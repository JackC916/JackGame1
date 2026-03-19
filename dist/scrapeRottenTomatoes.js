"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeTop100FromRottenTomatoes = scrapeTop100FromRottenTomatoes;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const SCRAPE_URL = process.env.SCRAPE_URL ??
    "https://editorial.rottentomatoes.com/guide/best-movies-21st-century/";
const MAX_ITEMS = 100;
// IMPORTANT:
// The initial selectors you gave (`div.row.countdown-item`, etc.) don't match
// the HTML structure returned by Axios+Cheerio in your environment.
// On this page, movie entries are grouped into blocks containing the poster,
// synopsis (includes `Synopsis:`), and Tomatometer rating.
const blockSelector = ".block-countdown";
function stripParensToYear(raw) {
    const cleaned = raw.replace(/[()]/g, "").trim();
    if (!cleaned)
        return null;
    const n = Number.parseInt(cleaned, 10);
    return Number.isFinite(n) ? n : null;
}
function stripSynopsisPrefix(raw) {
    return raw.replace(/^Synopsis:\s*/i, "").trim();
}
function resolveUrl(maybeUrl, base) {
    if (!maybeUrl)
        return null;
    try {
        return new URL(maybeUrl, base).href;
    }
    catch {
        return null;
    }
}
function parseTitleYearFromBlockText(blockText) {
    // Example seen on the page: "#1 Parasite (2019)"
    const t = blockText.replace(/\s+/g, " ").trim();
    const m = t.match(/#\s*\d+\s+(.+?)\s*\(\s*(\d{4})\s*\)/);
    if (!m)
        return { title: null, year: null };
    return { title: m[1].trim(), year: Number(m[2]) };
}
function parseSynopsisFromBlockText(blockText) {
    // The page is structured like: "Synopsis: <text> Starring: ... Directed By: ..."
    // We capture non-greedily until the next section header.
    const t = blockText.replace(/\s+/g, " ").trim();
    const m = t.match(/Synopsis:\s*(.+?)(?:\s+Starring:\s*|\s+Directed By:\s*|$)/i);
    if (!m)
        return null;
    return m[1].trim() || null;
}
function parseRatingFromBlockText(blockText) {
    // Typical format in text: "Tomatometer icon 99% Popcornmeter icon 90%"
    const t = blockText.replace(/\s+/g, " ").trim();
    // Use a wider window because the text may include extra tokens/icons.
    const m = t.match(/Tomatometer[\s\S]{0,500}?(\d{1,3})\s*%/i);
    return m ? `${m[1]}%` : null;
}
function extractRatingFromBlock(block, blockText) {
    // Prefer direct extraction if the rating value is present in a span.
    const directText = block.find("span.tomatometer-value").first().text().trim() ||
        block
            .find("[class*=tomatometer-value]")
            .first()
            .text()
            .trim();
    if (directText) {
        const m = directText.match(/(\d{1,3})\s*%/);
        if (m)
            return `${m[1]}%`;
    }
    // Fallback to parsing from the whole block text.
    return parseRatingFromBlockText(blockText);
}
async function scrapeTop100FromRottenTomatoes() {
    const sourceHost = process.env.SOURCE_HOST ?? new URL(SCRAPE_URL).hostname;
    const base = new URL(SCRAPE_URL).origin;
    const res = await axios_1.default.get(SCRAPE_URL, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
        },
        timeout: 30_000,
    });
    const $ = cheerio.load(res.data);
    const movies = [];
    const blocks = $(blockSelector).toArray();
    for (let idx = 0; idx < blocks.length && movies.length < MAX_ITEMS; idx++) {
        const block = $(blocks[idx]);
        // Only consider blocks that look like movie entries.
        const blockTextRaw = block.text();
        if (!/Synopsis:/i.test(blockTextRaw))
            continue;
        const posterEl = block.find("img.article_poster").first();
        const posterSrc = posterEl.attr("src") ?? posterEl.attr("data-src") ?? null;
        const posterImageUrl = resolveUrl(posterSrc, base);
        const blockText = blockTextRaw.replace(/\s+/g, " ").trim();
        const { title, year } = parseTitleYearFromBlockText(blockText);
        if (!title)
            continue;
        const description = parseSynopsisFromBlockText(blockText);
        const rating = extractRatingFromBlock(block, blockText);
        // Basic error handling for missing fields.
        if (year === null)
            console.warn(`Movie "${title}": missing/invalid year`);
        if (!description)
            console.warn(`Movie "${title}": missing synopsis/description`);
        if (!posterImageUrl)
            console.warn(`Movie "${title}": missing poster image url`);
        if (!rating)
            console.warn(`Movie "${title}": missing rating`);
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
