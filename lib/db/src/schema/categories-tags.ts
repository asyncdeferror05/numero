import { pgTable, serial, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { rulesTable } from "./rules";

// ─── Rule Category ─────────────────────────────────────────────────────────────
export const ruleCategoriesTable = pgTable("rule_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRuleCategorySchema = createInsertSchema(ruleCategoriesTable).omit({ id: true, created_at: true, updated_at: true });
export const updateRuleCategorySchema = insertRuleCategorySchema.partial();
export type RuleCategory = typeof ruleCategoriesTable.$inferSelect;
export type InsertRuleCategory = z.infer<typeof insertRuleCategorySchema>;

// ─── Rule Tag ──────────────────────────────────────────────────────────────────
export const ruleTagsTable = pgTable("rule_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertRuleTagSchema = createInsertSchema(ruleTagsTable).omit({ id: true, created_at: true });
export type RuleTag = typeof ruleTagsTable.$inferSelect;
export type InsertRuleTag = z.infer<typeof insertRuleTagSchema>;

// ─── Rule ↔ Tag Junction ───────────────────────────────────────────────────────
export const ruleTagAssignmentsTable = pgTable(
  "rule_tag_assignments",
  {
    rule_id: integer("rule_id").notNull().references(() => rulesTable.id, { onDelete: "cascade" }),
    tag_id: integer("tag_id").notNull().references(() => ruleTagsTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.rule_id, t.tag_id] })],
);
