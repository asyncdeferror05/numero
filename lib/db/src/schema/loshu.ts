import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const missingNumberRulesTable = pgTable("missing_number_rules", {
  id: serial("id").primaryKey(),
  missing_number: integer("missing_number").notNull(),
  title: text("title").notNull(),
  strengths: text("strengths").array().notNull().default([]),
  weaknesses: text("weaknesses").array().notNull().default([]),
  recommendations: text("recommendations").array().notNull().default([]),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const repeatedNumberRulesTable = pgTable("repeated_number_rules", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  count: integer("count").notNull(),
  title: text("title").notNull(),
  strengths: text("strengths").array().notNull().default([]),
  weaknesses: text("weaknesses").array().notNull().default([]),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const arrowRulesTable = pgTable("arrow_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  numbers: integer("numbers").array().notNull().default([]),
  arrow_type: text("arrow_type").notNull().default("strength"),
  interpretation: text("interpretation").notNull(),
  strengths: text("strengths").array().notNull().default([]),
  weaknesses: text("weaknesses").array().notNull().default([]),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMissingNumberRuleSchema = createInsertSchema(missingNumberRulesTable).omit({ id: true, created_at: true, updated_at: true });
export const updateMissingNumberRuleSchema = insertMissingNumberRuleSchema.partial();
export type MissingNumberRule = typeof missingNumberRulesTable.$inferSelect;
export type InsertMissingNumberRule = z.infer<typeof insertMissingNumberRuleSchema>;

export const insertRepeatedNumberRuleSchema = createInsertSchema(repeatedNumberRulesTable).omit({ id: true, created_at: true, updated_at: true });
export const updateRepeatedNumberRuleSchema = insertRepeatedNumberRuleSchema.partial();
export type RepeatedNumberRule = typeof repeatedNumberRulesTable.$inferSelect;
export type InsertRepeatedNumberRule = z.infer<typeof insertRepeatedNumberRuleSchema>;

export const insertArrowRuleSchema = createInsertSchema(arrowRulesTable).omit({ id: true, created_at: true, updated_at: true });
export const updateArrowRuleSchema = insertArrowRuleSchema.partial();
export type ArrowRule = typeof arrowRulesTable.$inferSelect;
export type InsertArrowRule = z.infer<typeof insertArrowRuleSchema>;
