import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tickerTable, adsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Ticker
router.get("/settings/ticker", async (req, res) => {
  try {
    const rows = await db.select().from(tickerTable).limit(1);
    if (rows.length === 0) {
      // Create default ticker
      const [ticker] = await db.insert(tickerTable).values({
        text: "Breaking News: Stay tuned to PulseGurgaon for the latest updates from India and around the world",
        enabled: true,
      }).returning();
      return res.json(ticker);
    }
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to get ticker");
    res.status(500).json({ error: "Failed to get ticker" });
  }
});

router.put("/settings/ticker", async (req, res) => {
  try {
    const { text, enabled } = req.body as { text?: string; enabled?: boolean };

    const existing = await db.select().from(tickerTable).limit(1);
    let ticker;

    if (existing.length === 0) {
      [ticker] = await db.insert(tickerTable).values({
        text: text || "Welcome to PulseGurgaon",
        enabled: enabled ?? true,
      }).returning();
    } else {
      [ticker] = await db.update(tickerTable).set({
        ...(text !== undefined && { text }),
        ...(enabled !== undefined && { enabled }),
        updatedAt: new Date(),
      }).where(eq(tickerTable.id, existing[0]!.id)).returning();
    }

    res.json(ticker);
  } catch (err) {
    req.log.error({ err }, "Failed to update ticker");
    res.status(500).json({ error: "Failed to update ticker" });
  }
});

// Ads
router.get("/settings/ads", async (req, res) => {
  try {
    const ads = await db.select().from(adsTable).orderBy(adsTable.createdAt);
    res.json({ ads });
  } catch (err) {
    req.log.error({ err }, "Failed to get ads");
    res.status(500).json({ error: "Failed to get ads" });
  }
});

router.post("/settings/ads", async (req, res) => {
  try {
    const { title, imageUrl, linkUrl, placement, enabled } = req.body as {
      title?: string; imageUrl?: string; linkUrl?: string; placement?: string; enabled?: boolean;
    };

    if (!title || !placement) {
      return res.status(400).json({ error: "title and placement are required" });
    }

    const [ad] = await db.insert(adsTable).values({
      title,
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || null,
      placement,
      enabled: enabled ?? true,
    }).returning();

    res.status(201).json(ad);
  } catch (err) {
    req.log.error({ err }, "Failed to create ad");
    res.status(500).json({ error: "Failed to create ad" });
  }
});

router.put("/settings/ads/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const { title, imageUrl, linkUrl, placement, enabled } = req.body as {
      title?: string; imageUrl?: string; linkUrl?: string; placement?: string; enabled?: boolean;
    };

    const [ad] = await db.update(adsTable).set({
      ...(title !== undefined && { title }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(linkUrl !== undefined && { linkUrl: linkUrl || null }),
      ...(placement !== undefined && { placement }),
      ...(enabled !== undefined && { enabled }),
    }).where(eq(adsTable.id, id)).returning();

    if (!ad) return res.status(404).json({ error: "Ad not found" });
    res.json(ad);
  } catch (err) {
    req.log.error({ err }, "Failed to update ad");
    res.status(500).json({ error: "Failed to update ad" });
  }
});

router.delete("/settings/ads/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    await db.delete(adsTable).where(eq(adsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete ad");
    res.status(500).json({ error: "Failed to delete ad" });
  }
});

export default router;
