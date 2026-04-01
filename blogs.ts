import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { blogsTable } from "@workspace/db/schema";
import { eq, desc, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/blogs", async (req, res) => {
  try {
    const { category, page, limit } = req.query as Record<string, string>;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Number(limit) || 20);
    const offset = (pageNum - 1) * limitNum;

    const where = category ? eq(blogsTable.category, category) : undefined;

    const [blogs, totalRes] = await Promise.all([
      db.select().from(blogsTable).where(where).orderBy(desc(blogsTable.createdAt)).limit(limitNum).offset(offset),
      db.select({ count: count() }).from(blogsTable).where(where),
    ]);

    res.json({ blogs, total: Number(totalRes[0]?.count || 0), page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "Failed to list blogs");
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

router.post("/blogs", async (req, res) => {
  try {
    const { title, content, image, category, excerpt } = req.body as {
      title?: string; content?: string; image?: string; category?: string; excerpt?: string;
    };

    if (!title || !content || !category || !excerpt) {
      return res.status(400).json({ error: "title, content, category, and excerpt are required" });
    }

    const [blog] = await db.insert(blogsTable).values({
      title,
      content,
      image: image || null,
      category,
      excerpt,
    }).returning();

    res.status(201).json(blog);
  } catch (err) {
    req.log.error({ err }, "Failed to create blog");
    res.status(500).json({ error: "Failed to create blog" });
  }
});

router.get("/blogs/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [blog] = await db.select().from(blogsTable).where(eq(blogsTable.id, id));
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    res.json(blog);
  } catch (err) {
    req.log.error({ err }, "Failed to get blog");
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

router.put("/blogs/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const { title, content, image, category, excerpt } = req.body as {
      title?: string; content?: string; image?: string; category?: string; excerpt?: string;
    };

    const [blog] = await db.update(blogsTable).set({
      title,
      content,
      image: image || null,
      category,
      excerpt,
      updatedAt: new Date(),
    }).where(eq(blogsTable.id, id)).returning();

    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (err) {
    req.log.error({ err }, "Failed to update blog");
    res.status(500).json({ error: "Failed to update blog" });
  }
});

router.delete("/blogs/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    await db.delete(blogsTable).where(eq(blogsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete blog");
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

export default router;
