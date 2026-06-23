import { Router } from "express";
import { db } from "@workspace/db";
import { formulasTable } from "@workspace/db";
import { eq, type SQL } from "drizzle-orm";
import { CreateFormulaBody, UpdateFormulaBody, ListFormulasQueryParams } from "@workspace/api-zod";
import { evaluateFormula, buildContext, DSL_REFERENCE } from "../lib/formula-engine.js";

const router = Router();

const fmt = (f: typeof formulasTable.$inferSelect) => ({
  ...f,
  created_at: f.created_at.toISOString(),
  updated_at: f.updated_at.toISOString(),
});

// DSL reference must be before /:id routes to avoid id matching
router.get("/formulas/dsl-reference", (_req, res) => {
  res.json(DSL_REFERENCE);
});

router.get("/formulas", async (req, res) => {
  const parsed = ListFormulasQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query" }); return; }

  const conditions: SQL[] = [];
  if (parsed.data.is_active !== undefined) conditions.push(eq(formulasTable.is_active, parsed.data.is_active));

  const formulas = await db.select().from(formulasTable)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(formulasTable.formula_type, formulasTable.version);

  res.json(formulas.map(fmt));
});

router.post("/formulas", async (req, res) => {
  const parsed = CreateFormulaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [formula] = await db.insert(formulasTable).values({
    ...parsed.data,
    version: parsed.data.version ?? 1,
    is_active: parsed.data.is_active ?? false,
  }).returning();

  res.status(201).json(fmt(formula));
});

router.get("/formulas/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [formula] = await db.select().from(formulasTable).where(eq(formulasTable.id, id));
  if (!formula) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(formula));
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
  res.json(fmt(formula));
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

  // Find highest version for this type
  const siblings = await db.select().from(formulasTable)
    .where(eq(formulasTable.formula_type, existing.formula_type));
  const maxVersion = siblings.reduce((m, f) => Math.max(m, f.version), 0);

  const nextVersion = maxVersion + 1;
  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = existing;
  const [formula] = await db.insert(formulasTable).values({
    ...rest,
    name: `${existing.name.replace(/ V\d+$/, "")} V${nextVersion}`,
    version: nextVersion,
    is_active: false,
  }).returning();

  res.status(201).json(fmt(formula));
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

  res.json(fmt(formula));
});

// Activate: makes this formula the active version for its type,
// deactivating all other formulas of the same type.
router.post("/formulas/:id/activate", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(formulasTable).where(eq(formulasTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  // Deactivate all other formulas of same type
  await db.update(formulasTable)
    .set({ is_active: false, updated_at: new Date() })
    .where(eq(formulasTable.formula_type, existing.formula_type));

  // Activate this one
  const [formula] = await db.update(formulasTable)
    .set({ is_active: true, updated_at: new Date() })
    .where(eq(formulasTable.id, id))
    .returning();

  res.json(fmt(formula));
});

// Test: evaluate formula expression with sample inputs
router.post("/formulas/:id/test", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [formula] = await db.select().from(formulasTable).where(eq(formulasTable.id, id));
  if (!formula) { res.status(404).json({ error: "Not found" }); return; }

  const body = req.body as Record<string, unknown>;
  const day = typeof body.day === "number" ? body.day : 1;
  const month = typeof body.month === "number" ? body.month : 1;
  const year = typeof body.year === "number" ? body.year : 1990;
  const name = typeof body.name === "string" ? body.name : "";
  const extra_input = typeof body.extra_input === "string" ? body.extra_input : "";

  const today = new Date();
  const dob = new Date(year, month - 1, day);
  const ctx = buildContext(dob, name, extra_input, today);
  const { result, error } = evaluateFormula(formula.formula_expression, ctx);

  res.json({
    result,
    error,
    expression: formula.formula_expression,
    formula_name: formula.name,
  });
});

export default router;
