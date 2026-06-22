import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const compatibilityRulesTable = pgTable("compatibility_rules", {
  id: serial("id").primaryKey(),
  number_a: integer("number_a").notNull(),
  number_b: integer("number_b").notNull(),
  compatibility_score: integer("compatibility_score").notNull().default(5),
  interpretation: text("interpretation").notNull().default(""),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCompatibilityRuleSchema = createInsertSchema(compatibilityRulesTable).omit({ id: true, created_at: true, updated_at: true });
export const updateCompatibilityRuleSchema = insertCompatibilityRuleSchema.partial();

export type CompatibilityRule = typeof compatibilityRulesTable.$inferSelect;
export type InsertCompatibilityRule = z.infer<typeof insertCompatibilityRuleSchema>;
