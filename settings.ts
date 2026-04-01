import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const tickerTable = pgTable("ticker", {
  id: serial("id").primaryKey(),
  text: text("text").notNull().default("Breaking News: Stay tuned to PulseGurgaon for the latest updates"),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adsTable = pgTable("ads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  placement: text("placement").notNull().default("feed"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
