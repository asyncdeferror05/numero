import { Router } from "express";
import { db } from "@workspace/db";
import { compatibilityRulesTable } from "@workspace/db";
import { eq, and, or, type SQL } from "drizzle-orm";

const router = Router();
const fmt = <T extends { created_at: Date; updated_at: Date }>(r: T) => ({
  ...r, created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString(),
});

router.get("/compatibility-rules", async (req, res) => {
  const conditions: SQL[] = [];
  if (req.query.number_a) conditions.push(eq(compatibilityRulesTable.number_a, Number(req.query.number_a)));
  if (req.query.number_b) conditions.push(eq(compatibilityRulesTable.number_b, Number(req.query.number_b)));
  const rows = await db.select().from(compatibilityRulesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(compatibilityRulesTable.number_a, compatibilityRulesTable.number_b);
  res.json(rows.map(fmt));
});

router.post("/compatibility-rules", async (req, res) => {
  const { number_a, number_b, compatibility_score, interpretation } = req.body;
  if (number_a == null || number_b == null) { res.status(400).json({ error: "number_a, number_b required" }); return; }
  const [row] = await db.insert(compatibilityRulesTable).values({
    number_a, number_b,
    compatibility_score: compatibility_score ?? 5,
    interpretation: interpretation ?? "",
  }).returning();
  res.status(201).json(fmt(row));
});

router.patch("/compatibility-rules/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { number_a, number_b, compatibility_score, interpretation } = req.body;
  const update: Record<string, unknown> = { updated_at: new Date() };
  if (number_a !== undefined) update.number_a = number_a;
  if (number_b !== undefined) update.number_b = number_b;
  if (compatibility_score !== undefined) update.compatibility_score = compatibility_score;
  if (interpretation !== undefined) update.interpretation = interpretation;
  const [row] = await db.update(compatibilityRulesTable).set(update).where(eq(compatibilityRulesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/compatibility-rules/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(compatibilityRulesTable).where(eq(compatibilityRulesTable.id, id));
  res.status(204).send();
});

export default router;
