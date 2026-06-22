import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const NUMBER_TYPES = [
  "personality",
  "birthday",
  "destiny",
  "personal_year",
  "personal_month",
  "personal_day",
  "vehicle",
  "phone",
  "house",
] as const;

export const numberMeaningsTable = pgTable("number_meanings", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  number_type: text("number_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  keywords_json: text("keywords_json").array().notNull().default([]),
  strengths_json: text("strengths_json").array().notNull().default([]),
  weaknesses_json: text("weaknesses_json").array().notNull().default([]),
  recommendations_json: text("recommendations_json").array().notNull().default([]),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNumberMeaningSchema = createInsertSchema(numberMeaningsTable).omit({ id: true, created_at: true, updated_at: true });
export const updateNumberMeaningSchema = insertNumberMeaningSchema.partial();

export type NumberMeaning = typeof numberMeaningsTable.$inferSelect;
export type InsertNumberMeaning = z.infer<typeof insertNumberMeaningSchema>;
