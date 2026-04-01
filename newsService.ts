import { db } from "@workspace/db";
import { articlesTable, metaTable } from "@workspace/db/schema";
import { eq, desc, ilike, or, gte, lte, and, count, sql } from "drizzle-orm";
import { fetchAllFeeds, type RawArticle } from "./rss.js";
import { enhanceArticle } from "./ai.js";
import { detectCategory } from "./categories.js";
import { logger } from "./logger.js";

const MAX_ARTICLES = 600;

export async function processAndStoreArticles(rawArticles: RawArticle[]): Promise<number> {
  let newCount = 0;

  // Get existing hashes to avoid reprocessing
  const existingHashes = new Set(
    (await db.select({ hash: articlesTable.contentHash }).from(articlesTable)).map(r => r.hash)
  );

  const newArticles = rawArticles.filter(a => !existingHashes.has(a.contentHash));

  logger.info({ total: rawArticles.length, new: newArticles.length }, "Processing new articles");

  for (const article of newArticles) {
    try {
      const category = detectCategory(article.title, article.description);

      // AI enhance — never crashes the server
      const enhanced = await enhanceArticle(article.title, article.description);

      await db.insert(articlesTable).values({
        title: enhanced.title,
        description: article.description,
        fullArticle: enhanced.fullArticle,
        summaryPoints: enhanced.summaryPoints,
        timeline: enhanced.timeline,
        vocabulary: enhanced.vocabulary,
        category,
        image: article.image,
        publishedAt: article.publishedAt,
        sourceUrl: article.sourceUrl,
        sourceName: article.sourceName,
        contentHash: article.contentHash,
        aiEnhanced: true,
      }).onConflictDoNothing();

      newCount++;
    } catch (err) {
      logger.error({ err, title: article.title }, "Failed to store article");
    }
  }

  // Trim to MAX_ARTICLES — keep most recent
  const totalCount = await db.select({ count: count() }).from(articlesTable);
  const total = Number(totalCount[0]?.count || 0);

  if (total > MAX_ARTICLES) {
    const toDelete = await db
      .select({ id: articlesTable.id })
      .from(articlesTable)
      .orderBy(articlesTable.createdAt)
      .limit(total - MAX_ARTICLES);

    for (const row of toDelete) {
      await db.delete(articlesTable).where(eq(articlesTable.id, row.id));
    }
  }

  // Update last refreshed timestamp
  await db
    .insert(metaTable)
    .values({ key: "last_refreshed", value: new Date().toISOString() })
    .onConflictDoUpdate({
      target: metaTable.key,
      set: { value: new Date().toISOString(), updatedAt: new Date() },
    });

  return newCount;
}

export async function refreshNews(): Promise<number> {
  const rawArticles = await fetchAllFeeds();
  return processAndStoreArticles(rawArticles);
}

export async function getArticles(params: {
  category?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, params.limit || 20);
  const offset = (page - 1) * limit;

  const where = params.category && params.category !== "All"
    ? eq(articlesTable.category, params.category)
    : undefined;

  const [articles, totalRes] = await Promise.all([
    db.select().from(articlesTable)
      .where(where)
      .orderBy(desc(articlesTable.publishedAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(articlesTable).where(where),
  ]);

  return { articles, total: Number(totalRes[0]?.count || 0), page, limit };
}

export async function getFeaturedArticles() {
  const articles = await db.select().from(articlesTable)
    .orderBy(desc(articlesTable.publishedAt))
    .limit(10);
  return { articles, total: articles.length, page: 1, limit: 10 };
}

export async function getArticleById(id: number) {
  const results = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
  return results[0] || null;
}

export async function searchArticles(params: {
  q?: string;
  from?: string;
  to?: string;
  category?: string;
}) {
  const conditions: ReturnType<typeof eq>[] = [];

  if (params.q) {
    const q = `%${params.q}%`;
    conditions.push(
      or(
        ilike(articlesTable.title, q),
        ilike(articlesTable.description, q),
        ilike(articlesTable.fullArticle, q),
      )!
    );
  }

  if (params.category && params.category !== "All") {
    conditions.push(eq(articlesTable.category, params.category));
  }

  if (params.from) {
    conditions.push(gte(articlesTable.publishedAt, new Date(params.from)));
  }

  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(articlesTable.publishedAt, toDate));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const articles = await db.select().from(articlesTable)
    .where(where)
    .orderBy(desc(articlesTable.publishedAt))
    .limit(20);

  return { articles, total: articles.length, query: params.q || "" };
}

export async function getStats() {
  const [articleCount, blogCountRes, categoryCountsRes, lastRefreshedRes] = await Promise.all([
    db.select({ count: count() }).from(articlesTable),
    db.select({ count: count() }).from((await import("@workspace/db/schema")).blogsTable),
    db.select({
      category: articlesTable.category,
      count: count(),
    }).from(articlesTable).groupBy(articlesTable.category),
    db.select({ value: metaTable.value }).from(metaTable).where(eq(metaTable.key, "last_refreshed")),
  ]);

  const categoryCounts: Record<string, number> = {};
  for (const row of categoryCountsRes) {
    categoryCounts[row.category] = Number(row.count);
  }

  return {
    totalArticles: Number(articleCount[0]?.count || 0),
    totalBlogs: Number(blogCountRes[0]?.count || 0),
    categoryCounts,
    lastRefreshed: lastRefreshedRes[0]?.value || null,
  };
}

export async function getCategories() {
  const rows = await db.select({
    name: articlesTable.category,
    count: count(),
  }).from(articlesTable).groupBy(articlesTable.category).orderBy(desc(count()));

  return { categories: rows.map(r => ({ name: r.name, count: Number(r.count) })) };
}
