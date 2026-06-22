import { Router } from "express";
import { db } from "@workspace/db";
import { remediesTable } from "@workspace/db";
import { eq, type SQL } from "drizzle-orm";

const router = Router();
const fmt = <T extends { created_at: Date; updated_at: Date }>(r: T) => ({
  ...r, created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString(),
});

router.get("/remedies", async (req, res) => {
  const conditions: SQL[] = [];
  if (req.query.category) conditions.push(eq(remediesTable.category, String(req.query.category)));
  const rows = await db.select().from(remediesTable)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(remediesTable.category, remediesTable.title);
  res.json(rows.map(fmt));
});

router.post("/remedies", async (req, res) => {
  const { title, category, description } = req.body;
  if (!title || !category) { res.status(400).json({ error: "title, category required" }); return; }
  const [row] = await db.insert(remediesTable).values({ title, category, description: description ?? "" }).returning();
  res.status(201).json(fmt(row));
});

router.patch("/remedies/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title, category, description } = req.body;
  const update: Record<string, unknown> = { updated_at: new Date() };
  if (title !== undefined) update.title = title;
  if (category !== undefined) update.category = category;
  if (description !== undefined) update.description = description;
  const [row] = await db.update(remediesTable).set(update).where(eq(remediesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/remedies/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(remediesTable).where(eq(remediesTable.id, id));
  res.status(204).send();
});

export default router;
