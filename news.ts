import { Router, type IRouter } from "express";
import { refreshNews, getArticles, getFeaturedArticles, getArticleById, getStats, getCategories, processAndStoreArticles, searchArticles } from "../lib/newsService.js";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/news", async (req, res) => {
  try {
    const { category, page, limit } = req.query as Record<string, string>;
    const result = await getArticles({
      category: category || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list news");
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

router.get("/news/featured", async (req, res) => {
  try {
    const result = await getFeaturedArticles();
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get featured news");
    res.status(500).json({ error: "Failed to fetch featured news" });
  }
});

router.get("/news/stats", async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/news/categories", async (req, res) => {
  try {
    const result = await getCategories();
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get categories");
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/news/refresh", async (req, res) => {
  try {
    const newArticles = await refreshNews();
    res.json({ message: "News refreshed successfully", newArticles });
  } catch (err) {
    req.log.error({ err }, "Failed to refresh news");
    res.status(500).json({ error: "Failed to refresh news" });
  }
});

router.get("/news/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const article = await getArticleById(id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    res.json(article);
  } catch (err) {
    req.log.error({ err }, "Failed to get article");
    res.status(500).json({ error: "Failed to fetch article" });
  }
});

export default router;
