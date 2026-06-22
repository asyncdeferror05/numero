import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const formulasTable = pgTable("formulas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  formula_type: text("formula_type").notNull(),
  formula_expression: text("formula_expression").notNull(),
  description: text("description"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFormulaSchema = createInsertSchema(formulasTable).omit({ id: true, created_at: true, updated_at: true });
export const updateFormulaSchema = insertFormulaSchema.partial();

export type Formula = typeof formulasTable.$inferSelect;
export type InsertFormula = z.infer<typeof insertFormulaSchema>;
export type UpdateFormula = z.infer<typeof updateFormulaSchema>;
