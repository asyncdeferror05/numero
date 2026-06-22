import { Router } from "express";
import { db } from "@workspace/db";
import { ruleCategoriesTable, ruleTagsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const fmtTs = <T extends { created_at: Date; updated_at: Date }>(r: T) => ({
  ...r, created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString(),
});
const fmtTag = <T extends { created_at: Date }>(r: T) => ({
  ...r, created_at: r.created_at.toISOString(),
});

// ─── Tags ──────────────────────────────────────────────────────────────────────

router.get("/rule-tags", async (_req, res) => {
  const rows = await db.select().from(ruleTagsTable).orderBy(ruleTagsTable.name);
  res.json(rows.map(fmtTag));
});

router.post("/rule-tags", async (req, res) => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await db.insert(ruleTagsTable).values({ name }).returning();
  res.status(201).json(fmtTag(row));
});

router.delete("/rule-tags/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(ruleTagsTable).where(eq(ruleTagsTable.id, id));
  res.status(204).send();
});

// ─── Categories ────────────────────────────────────────────────────────────────

router.get("/rule-categories", async (_req, res) => {
  const rows = await db.select().from(ruleCategoriesTable).orderBy(ruleCategoriesTable.name);
  res.json(rows.map(fmtTs));
});

router.post("/rule-categories", async (req, res) => {
  const { name, description } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await db.insert(ruleCategoriesTable).values({ name, description: description ?? "" }).returning();
  res.status(201).json(fmtTs(row));
});

router.patch("/rule-categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, description } = req.body;
  const update: Record<string, unknown> = { updated_at: new Date() };
  if (name !== undefined) update.name = name;
  if (description !== undefined) update.description = description;
  const [row] = await db.update(ruleCategoriesTable).set(update).where(eq(ruleCategoriesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmtTs(row));
});

router.delete("/rule-categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(ruleCategoriesTable).where(eq(ruleCategoriesTable.id, id));
  res.status(204).send();
});

export default router;
