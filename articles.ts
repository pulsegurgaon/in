import { pgTable, serial, text, boolean, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

export const articlesTable = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  fullArticle: text("full_article").notNull().default(""),
  summaryPoints: jsonb("summary_points").notNull().default([]),
  timeline: jsonb("timeline").notNull().default([]),
  vocabulary: jsonb("vocabulary").notNull().default([]),
  category: text("category").notNull().default("General"),
  image: text("image"),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  contentHash: text("content_hash").notNull().unique(),
  aiEnhanced: boolean("ai_enhanced").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blogsTable = pgTable("blogs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  image: text("image"),
  category: text("category").notNull().default("General"),
  excerpt: text("excerpt").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const metaTable = pgTable("meta", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
