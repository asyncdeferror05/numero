import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Profession Mapping ────────────────────────────────────────────────────────
export const professionMappingsTable = pgTable("profession_mappings", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  profession: text("profession").notNull(),
  weight: real("weight").notNull().default(1.0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProfessionMappingSchema = createInsertSchema(professionMappingsTable).omit({ id: true, created_at: true, updated_at: true });
export const updateProfessionMappingSchema = insertProfessionMappingSchema.partial();
export type ProfessionMapping = typeof professionMappingsTable.$inferSelect;
export type InsertProfessionMapping = z.infer<typeof insertProfessionMappingSchema>;

// ─── Health Mapping ────────────────────────────────────────────────────────────
export const healthMappingsTable = pgTable("health_mappings", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  health_area: text("health_area").notNull(),
  severity: text("severity").notNull().default("mild"),
  notes: text("notes").notNull().default(""),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHealthMappingSchema = createInsertSchema(healthMappingsTable).omit({ id: true, created_at: true, updated_at: true });
export const updateHealthMappingSchema = insertHealthMappingSchema.partial();
export type HealthMapping = typeof healthMappingsTable.$inferSelect;
export type InsertHealthMapping = z.infer<typeof insertHealthMappingSchema>;

// ─── Relationship Mapping ──────────────────────────────────────────────────────
export const relationshipMappingsTable = pgTable("relationship_mappings", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  relationship_type: text("relationship_type").notNull(),
  interpretation: text("interpretation").notNull().default(""),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRelationshipMappingSchema = createInsertSchema(relationshipMappingsTable).omit({ id: true, created_at: true, updated_at: true });
export const updateRelationshipMappingSchema = insertRelationshipMappingSchema.partial();
export type RelationshipMapping = typeof relationshipMappingsTable.$inferSelect;
export type InsertRelationshipMapping = z.infer<typeof insertRelationshipMappingSchema>;
