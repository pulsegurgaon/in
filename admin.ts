import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

const router: IRouter = Router();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "rishabh1745T";

// Simple token store (in-memory, good enough for demo)
const validTokens = new Set<string>();

router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = crypto.randomBytes(32).toString("hex");
      validTokens.add(token);
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    req.log.error({ err }, "Admin login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

// Middleware to check admin token
function requireAdmin(req: Parameters<typeof router.use>[1], res: Parameters<typeof router.use>[2], next: Parameters<typeof router.use>[3]) {
  const auth = (req as { headers: Record<string, string> }).headers["authorization"];
  const token = auth?.replace("Bearer ", "");
  if (!token || !validTokens.has(token)) {
    return (res as { status: (n: number) => { json: (d: unknown) => void } }).status(401).json({ error: "Unauthorized" });
  }
  next();
}

router.put("/admin/articles/:id", requireAdmin as Parameters<typeof router.put>[1], async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const { title, description, fullArticle, category, image } = req.body as {
      title?: string; description?: string; fullArticle?: string; category?: string; image?: string;
    };

    const [article] = await db.update(articlesTable).set({
      ...(title && { title }),
      ...(description && { description }),
      ...(fullArticle && { fullArticle }),
      ...(category && { category }),
      ...(image !== undefined && { image: image || null }),
    }).where(eq(articlesTable.id, id)).returning();

    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(article);
  } catch (err) {
    req.log.error({ err }, "Failed to update article");
    res.status(500).json({ error: "Failed to update article" });
  }
});

router.delete("/admin/articles/:id", requireAdmin as Parameters<typeof router.delete>[1], async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    await db.delete(articlesTable).where(eq(articlesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete article");
    res.status(500).json({ error: "Failed to delete article" });
  }
});

export default router;
