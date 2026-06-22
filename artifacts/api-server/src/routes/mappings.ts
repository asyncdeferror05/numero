import { Router } from "express";
import { db } from "@workspace/db";
import { professionMappingsTable, healthMappingsTable, relationshipMappingsTable } from "@workspace/db";
import { eq, and, type SQL } from "drizzle-orm";

const router = Router();
const fmt = <T extends { created_at: Date; updated_at: Date }>(r: T) => ({
  ...r, created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString(),
});

// ─── Profession Mappings ──────────────────────────────────────────────────────

router.get("/profession-mappings", async (req, res) => {
  const conditions: SQL[] = [];
  if (req.query.number) conditions.push(eq(professionMappingsTable.number, Number(req.query.number)));
  const rows = await db.select().from(professionMappingsTable)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(professionMappingsTable.number, professionMappingsTable.profession);
  res.json(rows.map(fmt));
});

router.post("/profession-mappings", async (req, res) => {
  const { number, profession, weight } = req.body;
  if (!number || !profession) { res.status(400).json({ error: "number, profession required" }); return; }
  const [row] = await db.insert(professionMappingsTable).values({ number, profession, weight: weight ?? 1.0 }).returning();
  res.status(201).json(fmt(row));
});

router.patch("/profession-mappings/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { number, profession, weight } = req.body;
  const update: Record<string, unknown> = { updated_at: new Date() };
  if (number !== undefined) update.number = number;
  if (profession !== undefined) update.profession = profession;
  if (weight !== undefined) update.weight = weight;
  const [row] = await db.update(professionMappingsTable).set(update).where(eq(professionMappingsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/profession-mappings/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(professionMappingsTable).where(eq(professionMappingsTable.id, id));
  res.status(204).send();
});

// ─── Health Mappings ──────────────────────────────────────────────────────────

router.get("/health-mappings", async (req, res) => {
  const conditions: SQL[] = [];
  if (req.query.number) conditions.push(eq(healthMappingsTable.number, Number(req.query.number)));
  const rows = await db.select().from(healthMappingsTable)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(healthMappingsTable.number);
  res.json(rows.map(fmt));
});

router.post("/health-mappings", async (req, res) => {
  const { number, health_area, severity, notes } = req.body;
  if (!number || !health_area) { res.status(400).json({ error: "number, health_area required" }); return; }
  const [row] = await db.insert(healthMappingsTable).values({ number, health_area, severity: severity ?? "mild", notes: notes ?? "" }).returning();
  res.status(201).json(fmt(row));
});

router.patch("/health-mappings/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { number, health_area, severity, notes } = req.body;
  const update: Record<string, unknown> = { updated_at: new Date() };
  if (number !== undefined) update.number = number;
  if (health_area !== undefined) update.health_area = health_area;
  if (severity !== undefined) update.severity = severity;
  if (notes !== undefined) update.notes = notes;
  const [row] = await db.update(healthMappingsTable).set(update).where(eq(healthMappingsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/health-mappings/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(healthMappingsTable).where(eq(healthMappingsTable.id, id));
  res.status(204).send();
});

// ─── Relationship Mappings ────────────────────────────────────────────────────

router.get("/relationship-mappings", async (req, res) => {
  const conditions: SQL[] = [];
  if (req.query.number) conditions.push(eq(relationshipMappingsTable.number, Number(req.query.number)));
  if (req.query.relationship_type) conditions.push(eq(relationshipMappingsTable.relationship_type, String(req.query.relationship_type)));
  const rows = await db.select().from(relationshipMappingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(relationshipMappingsTable.number, relationshipMappingsTable.relationship_type);
  res.json(rows.map(fmt));
});

router.post("/relationship-mappings", async (req, res) => {
  const { number, relationship_type, interpretation } = req.body;
  if (!number || !relationship_type) { res.status(400).json({ error: "number, relationship_type required" }); return; }
  const [row] = await db.insert(relationshipMappingsTable).values({ number, relationship_type, interpretation: interpretation ?? "" }).returning();
  res.status(201).json(fmt(row));
});

router.patch("/relationship-mappings/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { number, relationship_type, interpretation } = req.body;
  const update: Record<string, unknown> = { updated_at: new Date() };
  if (number !== undefined) update.number = number;
  if (relationship_type !== undefined) update.relationship_type = relationship_type;
  if (interpretation !== undefined) update.interpretation = interpretation;
  const [row] = await db.update(relationshipMappingsTable).set(update).where(eq(relationshipMappingsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/relationship-mappings/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(relationshipMappingsTable).where(eq(relationshipMappingsTable.id, id));
  res.status(204).send();
});

export default router;
