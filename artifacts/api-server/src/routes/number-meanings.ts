import { Router } from "express";
import { db } from "@workspace/db";
import { numberMeaningsTable } from "@workspace/db";
import { eq, and, type SQL } from "drizzle-orm";

const router = Router();
const fmt = <T extends { created_at: Date; updated_at: Date }>(r: T) => ({
  ...r, created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString(),
});

router.get("/number-meanings", async (req, res) => {
  const conditions: SQL[] = [];
  if (req.query.number_type) conditions.push(eq(numberMeaningsTable.number_type, String(req.query.number_type)));
  if (req.query.number) conditions.push(eq(numberMeaningsTable.number, Number(req.query.number)));

  const rows = await db.select().from(numberMeaningsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(numberMeaningsTable.number_type, numberMeaningsTable.number);
  res.json(rows.map(fmt));
});

router.post("/number-meanings", async (req, res) => {
  const { number, number_type, title, description, keywords_json, strengths_json, weaknesses_json, recommendations_json } = req.body;
  if (!number || !number_type || !title) { res.status(400).json({ error: "number, number_type, title required" }); return; }

  const [row] = await db.insert(numberMeaningsTable).values({
    number, number_type, title,
    description: description ?? "",
    keywords_json: keywords_json ?? [],
    strengths_json: strengths_json ?? [],
    weaknesses_json: weaknesses_json ?? [],
    recommendations_json: recommendations_json ?? [],
  }).returning();
  res.status(201).json(fmt(row));
});

router.get("/number-meanings/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(numberMeaningsTable).where(eq(numberMeaningsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.patch("/number-meanings/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { number, number_type, title, description, keywords_json, strengths_json, weaknesses_json, recommendations_json } = req.body;
  const update: Record<string, unknown> = { updated_at: new Date() };
  if (number !== undefined) update.number = number;
  if (number_type !== undefined) update.number_type = number_type;
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (keywords_json !== undefined) update.keywords_json = keywords_json;
  if (strengths_json !== undefined) update.strengths_json = strengths_json;
  if (weaknesses_json !== undefined) update.weaknesses_json = weaknesses_json;
  if (recommendations_json !== undefined) update.recommendations_json = recommendations_json;

  const [row] = await db.update(numberMeaningsTable).set(update).where(eq(numberMeaningsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/number-meanings/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(numberMeaningsTable).where(eq(numberMeaningsTable.id, id));
  res.status(204).send();
});

export default router;
