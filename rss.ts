import Parser from "rss-parser";
import * as crypto from "crypto";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "PulseGurgaon/1.0 RSS Reader",
  },
});

export const RSS_FEEDS = [
  { name: "Times of India", url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms" },
  { name: "The Hindu", url: "https://www.thehindu.com/news/feeder/default.rss" },
  { name: "BBC World", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "NYT World", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { name: "MoneyControl", url: "https://www.moneycontrol.com/rss/latestnews.xml" },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
];

export interface RawArticle {
  title: string;
  description: string;
  image: string | null;
  publishedAt: Date;
  sourceUrl: string | null;
  sourceName: string;
  contentHash: string;
}

function cleanHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImage(item: Parser.Item): string | null {
  // Try various common image fields
  const raw = item as Record<string, unknown>;
  const mediaContent = raw["media:content"] as { $?: { url?: string } } | undefined;
  const mediaThumbnail = raw["media:thumbnail"] as { $?: { url?: string } } | undefined;
  const enclosure = item.enclosure as { url?: string } | undefined;

  if (mediaContent?.$.url) return mediaContent.$.url;
  if (mediaThumbnail?.$.url) return mediaThumbnail.$.url;
  if (enclosure?.url && enclosure.url.match(/\.(jpg|jpeg|png|gif|webp)/i)) return enclosure.url;

  // Try extracting from content/description
  const content = (raw["content:encoded"] as string | undefined) || item.content || item.contentSnippet || "";
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
  if (imgMatch) return imgMatch[1];

  return null;
}

function hashContent(title: string, description: string): string {
  const normalized = (title + description).toLowerCase().replace(/\s+/g, " ").trim();
  return crypto.createHash("md5").update(normalized).digest("hex");
}

export async function fetchFeed(feed: { name: string; url: string }): Promise<RawArticle[]> {
  try {
    const result = await parser.parseURL(feed.url);
    return (result.items || []).slice(0, 20).map((item) => {
      const title = cleanHtml(item.title || "");
      const description = cleanHtml(
        (item as Record<string, string>)["content:encoded"] ||
        item.contentSnippet ||
        item.content ||
        item.summary ||
        ""
      ).slice(0, 500);

      return {
        title,
        description,
        image: extractImage(item),
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        sourceUrl: item.link || null,
        sourceName: feed.name,
        contentHash: hashContent(title, description),
      };
    }).filter(a => a.title.length > 10);
  } catch (err) {
    return [];
  }
}

export async function fetchAllFeeds(): Promise<RawArticle[]> {
  const results = await Promise.allSettled(RSS_FEEDS.map(feed => fetchFeed(feed)));
  const articles: RawArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    }
  }

  // Deduplicate by hash
  const seen = new Set<string>();
  return articles.filter(a => {
    if (seen.has(a.contentHash)) return false;
    seen.add(a.contentHash);
    return true;
  });
}
