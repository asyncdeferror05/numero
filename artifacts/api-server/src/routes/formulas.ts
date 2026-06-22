import { Router } from "express";
import { db } from "@workspace/db";
import { formulasTable } from "@workspace/db";
import { eq, type SQL } from "drizzle-orm";
import { CreateFormulaBody, UpdateFormulaBody, ListFormulasQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/formulas", async (req, res) => {
  const parsed = ListFormulasQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query" }); return; }

  const conditions: SQL[] = [];
  if (parsed.data.is_active !== undefined) conditions.push(eq(formulasTable.is_active, parsed.data.is_active));

  const formulas = await db.select().from(formulasTable)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(formulasTable.created_at);

  res.json(formulas.map((f) => ({ ...f, created_at: f.created_at.toISOString(), updated_at: f.updated_at.toISOString() })));
});

router.post("/formulas", async (req, res) => {
  const parsed = CreateFormulaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [formula] = await db.insert(formulasTable).values({
    ...parsed.data,
    is_active: parsed.data.is_active ?? true,
  }).returning();

  res.status(201).json({ ...formula, created_at: formula.created_at.toISOString(), updated_at: formula.updated_at.toISOString() });
});

router.get("/formulas/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [formula] = await db.select().from(formulasTable).where(eq(formulasTable.id, id));
  if (!formula) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...formula, created_at: formula.created_at.toISOString(), updated_at: formula.updated_at.toISOString() });
});

router.patch("/formulas/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateFormulaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [formula] = await db.update(formulasTable)
    .set({ ...parsed.data, updated_at: new Date() })
    .where(eq(formulasTable.id, id))
    .returning();

  if (!formula) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...formula, created_at: formula.created_at.toISOString(), updated_at: formula.updated_at.toISOString() });
});

router.delete("/formulas/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(formulasTable).where(eq(formulasTable.id, id));
  res.status(204).send();
});

router.post("/formulas/:id/duplicate", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(formulasTable).where(eq(formulasTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = existing;
  const [formula] = await db.insert(formulasTable).values({ ...rest, name: `${rest.name} (Copy)` }).returning();
  res.status(201).json({ ...formula, created_at: formula.created_at.toISOString(), updated_at: formula.updated_at.toISOString() });
});

router.patch("/formulas/:id/toggle", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(formulasTable).where(eq(formulasTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const [formula] = await db.update(formulasTable)
    .set({ is_active: !existing.is_active, updated_at: new Date() })
    .where(eq(formulasTable.id, id))
    .returning();

  res.json({ ...formula, created_at: formula.created_at.toISOString(), updated_at: formula.updated_at.toISOString() });
});

export default router;
