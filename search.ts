import { Router, type IRouter } from "express";
import { searchArticles } from "../lib/newsService.js";
import { aiSearchQuery } from "../lib/ai.js";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/search", async (req, res) => {
  try {
    const { q, from, to, category } = req.query as Record<string, string>;
    const result = await searchArticles({ q, from, to, category });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

router.post("/search/ai", async (req, res) => {
  try {
    const { query } = req.body as { query?: string };
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query is required" });
    }

    // Get recent articles for AI to rank
    const allArticles = await db.select({
      id: articlesTable.id,
      title: articlesTable.title,
      description: articlesTable.description,
      category: articlesTable.category,
    }).from(articlesTable).orderBy(desc(articlesTable.publishedAt)).limit(100);

    const aiResult = await aiSearchQuery(query, allArticles);

    // Fetch the matched articles in order
    const matchedArticles: typeof allArticles = [];
    for (const id of aiResult.ids) {
      const found = allArticles.find(a => a.id === id);
      if (found) matchedArticles.push(found);
    }

    // Fetch full article data for matches
    const fullArticles = await Promise.all(
      aiResult.ids.slice(0, 10).map(async (id) => {
        const results = await db.select().from(articlesTable).where(
          (await import("drizzle-orm")).eq(articlesTable.id, id)
        );
        return results[0] || null;
      })
    );

    res.json({
      articles: fullArticles.filter(Boolean),
      interpretation: aiResult.interpretation,
      suggestedTopics: aiResult.suggestedTopics,
    });
  } catch (err) {
    req.log.error({ err }, "AI search failed");
    res.status(500).json({ error: "AI search failed" });
  }
});

export default router;
