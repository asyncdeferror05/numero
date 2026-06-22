import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const REMEDY_CATEGORIES = [
  "health",
  "career",
  "finance",
  "relationship",
  "spiritual",
] as const;

export const remediesTable = pgTable("remedies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRemedySchema = createInsertSchema(remediesTable).omit({ id: true, created_at: true, updated_at: true });
export const updateRemedySchema = insertRemedySchema.partial();

export type Remedy = typeof remediesTable.$inferSelect;
export type InsertRemedy = z.infer<typeof insertRemedySchema>;
