/**
 * Web scraper for indexing Berkeley resource pages (both .edu and
 * off-campus community sites).
 *
 * Scraped content is stored in the ScrapedPage table and used by the
 * agent search pipeline.  The scraper runs in batches and includes
 * retry logic with exponential backoff so non-.edu sites that are
 * pickier about bot traffic still get indexed reliably.
 */

import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";
import { BERKELEY_SOURCES, type BerkeleySource } from "@/lib/berkeley-sources";

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ── Fetch with retry ────────────────────────────────────────────────────

const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 1_500;

async function fetchPage(url: string): Promise<string | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      clearTimeout(timer);

      if (res.status === 429 || res.status >= 500) {
        if (attempt < MAX_RETRIES) {
          const backoff = INITIAL_BACKOFF_MS * 2 ** attempt;
          console.log(`[Scrape] ${res.status} for ${url} — retrying in ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        return null;
      }

      if (!res.ok) return null;
      return await res.text();
    } catch (err) {
      clearTimeout(timer);

      if (attempt < MAX_RETRIES) {
        const backoff = INITIAL_BACKOFF_MS * 2 ** attempt;
        console.log(`[Scrape] Network error for ${url} — retrying in ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      return null;
    }
  }

  return null;
}

// ── Content extraction ──────────────────────────────────────────────────

function extractContent(html: string): { title: string; text: string; keywords: string[] } {
  const $ = cheerio.load(html);

  const title =
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled";

  $("script,style,nav,footer,aside,noscript,iframe,form,svg,img,video,audio").remove();
  $('[role="navigation"]').remove();
  $('[aria-hidden="true"]').remove();

  // Cookie banners and modals common on non-.edu sites
  $('[class*="cookie"]').remove();
  $('[id*="cookie"]').remove();
  $('[class*="consent"]').remove();
  $('[class*="modal"]').remove();

  const candidates = [
    $("main").text(),
    $("article").text(),
    $('[role="main"]').text(),
    $("#content").text(),
    $(".content").text(),
    $(".main-content").text(),
    $(".field-items").text(),
    $(".node-content").text(),
    $(".page-content").text(),
    $(".entry-content").text(),
  ];

  const bestBlock = candidates
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 100)
    .sort((a, b) => b.length - a.length)[0];

  const text = (bestBlock ?? $("body").text().replace(/\s+/g, " ").trim()).slice(0, 30000);

  const keywords = extractKeywords(text);

  return { title: title.slice(0, 300), text, keywords };
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const words = lower.split(/[^a-z]+/).filter((w) => w.length > 3);

  const stopWords = new Set([
    "this", "that", "with", "from", "have", "will", "been", "were", "they",
    "their", "them", "your", "more", "about", "also", "each", "which", "than",
    "into", "some", "other", "most", "would", "could", "should", "does", "these",
    "those", "what", "when", "where", "there", "here", "very", "just", "only",
    "such", "many", "much", "well", "back", "even", "over", "after", "before",
    "then", "first", "last", "next", "make", "made", "like", "time", "year",
    "page", "site", "click", "menu", "link", "home", "search", "skip", "main",
    "navigation", "footer", "header", "content", "close", "open", "toggle",
    "cookie", "cookies", "accept", "privacy", "policy", "terms", "subscribe",
  ]);

  const freq = new Map<string, number>();
  for (const w of words) {
    if (stopWords.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word]) => word);
}

// ── Public API ──────────────────────────────────────────────────────────

export async function scrapeSource(source: BerkeleySource): Promise<boolean> {
  const html = await fetchPage(source.url);
  if (!html) return false;

  const { title, text, keywords } = extractContent(html);

  if (text.length < 50) return false;

  await prisma.scrapedPage.upsert({
    where: { url: source.url },
    update: {
      title: title || source.label,
      domain: domainOf(source.url),
      category: source.category,
      bodyText: text,
      keywords,
      scrapedAt: new Date(),
    },
    create: {
      url: source.url,
      title: title || source.label,
      domain: domainOf(source.url),
      category: source.category,
      bodyText: text,
      keywords,
    },
  });

  return true;
}

export async function scrapeAllSources(
  onProgress?: (done: number, total: number, url: string, ok: boolean) => void,
): Promise<{ success: number; failed: number; total: number }> {
  const total = BERKELEY_SOURCES.length;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < BERKELEY_SOURCES.length; i += 4) {
    const batch = BERKELEY_SOURCES.slice(i, i + 4);
    await Promise.allSettled(
      batch.map(async (source) => {
        const ok = await scrapeSource(source);
        if (ok) success++;
        else failed++;
        onProgress?.(success + failed, total, source.url, ok);
        return ok;
      }),
    );

    if (i + 4 < BERKELEY_SOURCES.length) {
      await new Promise((r) => setTimeout(r, 700));
    }
  }

  return { success, failed, total };
}
