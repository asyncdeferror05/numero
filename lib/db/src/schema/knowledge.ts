import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const knowledgeEntriesTable = pgTable("knowledge_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array().notNull().default([]),
  is_published: boolean("is_published").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKnowledgeEntrySchema = createInsertSchema(knowledgeEntriesTable).omit({ id: true, created_at: true, updated_at: true });
export const updateKnowledgeEntrySchema = insertKnowledgeEntrySchema.partial();

export type KnowledgeEntry = typeof knowledgeEntriesTable.$inferSelect;
export type InsertKnowledgeEntry = z.infer<typeof insertKnowledgeEntrySchema>;
export type UpdateKnowledgeEntry = z.infer<typeof updateKnowledgeEntrySchema>;
