import { pgTable, serial, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rulesTable = pgTable("rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rule_type: text("rule_type").notNull(),
  description: text("description"),
  condition_json: jsonb("condition_json").notNull().default({}),
  result_json: jsonb("result_json").notNull().default({}),
  priority: integer("priority").notNull().default(100),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRuleSchema = createInsertSchema(rulesTable).omit({ id: true, created_at: true, updated_at: true });
export const updateRuleSchema = insertRuleSchema.partial();

export type Rule = typeof rulesTable.$inferSelect;
export type InsertRule = z.infer<typeof insertRuleSchema>;
export type UpdateRule = z.infer<typeof updateRuleSchema>;
