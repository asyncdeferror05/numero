import { Router } from "express";
import { db } from "@workspace/db";
import { missingNumberRulesTable, repeatedNumberRulesTable, arrowRulesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateMissingNumberRuleBody,
  UpdateMissingNumberRuleBody,
  UpdateMissingNumberRuleParams,
  DeleteMissingNumberRuleParams,
  CreateRepeatedNumberRuleBody,
  UpdateRepeatedNumberRuleBody,
  UpdateRepeatedNumberRuleParams,
  DeleteRepeatedNumberRuleParams,
  CreateArrowRuleBody,
  UpdateArrowRuleBody,
  UpdateArrowRuleParams,
  DeleteArrowRuleParams,
} from "@workspace/api-zod";

const router = Router();

const fmt = <T extends { created_at: Date; updated_at: Date }>(r: T) => ({
  ...r,
  created_at: r.created_at.toISOString(),
  updated_at: r.updated_at.toISOString(),
});

// ─── Missing Number Rules ────────────────────────────────────────────────────

router.get("/loshu/missing", async (_req, res) => {
  const rows = await db.select().from(missingNumberRulesTable).orderBy(missingNumberRulesTable.missing_number);
  res.json(rows.map(fmt));
});

router.post("/loshu/missing", async (req, res) => {
  const parsed = CreateMissingNumberRuleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [row] = await db.insert(missingNumberRulesTable).values({
    ...parsed.data,
    strengths: parsed.data.strengths ?? [],
    weaknesses: parsed.data.weaknesses ?? [],
    recommendations: parsed.data.recommendations ?? [],
    is_active: parsed.data.is_active ?? true,
  }).returning();

  res.status(201).json(fmt(row));
});

router.patch("/loshu/missing/:id", async (req, res) => {
  const parsed = UpdateMissingNumberRuleParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = UpdateMissingNumberRuleBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [row] = await db.update(missingNumberRulesTable)
    .set({ ...body.data, updated_at: new Date() })
    .where(eq(missingNumberRulesTable.id, parsed.data.id))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/loshu/missing/:id", async (req, res) => {
  const parsed = DeleteMissingNumberRuleParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(missingNumberRulesTable).where(eq(missingNumberRulesTable.id, parsed.data.id));
  res.status(204).send();
});

// ─── Repeated Number Rules ────────────────────────────────────────────────────

router.get("/loshu/repeated", async (_req, res) => {
  const rows = await db.select().from(repeatedNumberRulesTable).orderBy(repeatedNumberRulesTable.number);
  res.json(rows.map(fmt));
});

router.post("/loshu/repeated", async (req, res) => {
  const parsed = CreateRepeatedNumberRuleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [row] = await db.insert(repeatedNumberRulesTable).values({
    ...parsed.data,
    strengths: parsed.data.strengths ?? [],
    weaknesses: parsed.data.weaknesses ?? [],
    is_active: parsed.data.is_active ?? true,
  }).returning();

  res.status(201).json(fmt(row));
});

router.patch("/loshu/repeated/:id", async (req, res) => {
  const parsed = UpdateRepeatedNumberRuleParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = UpdateRepeatedNumberRuleBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [row] = await db.update(repeatedNumberRulesTable)
    .set({ ...body.data, updated_at: new Date() })
    .where(eq(repeatedNumberRulesTable.id, parsed.data.id))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/loshu/repeated/:id", async (req, res) => {
  const parsed = DeleteRepeatedNumberRuleParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(repeatedNumberRulesTable).where(eq(repeatedNumberRulesTable.id, parsed.data.id));
  res.status(204).send();
});

// ─── Arrow Rules ──────────────────────────────────────────────────────────────

router.get("/loshu/arrows", async (_req, res) => {
  const rows = await db.select().from(arrowRulesTable).orderBy(arrowRulesTable.name);
  res.json(rows.map(fmt));
});

router.post("/loshu/arrows", async (req, res) => {
  const parsed = CreateArrowRuleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [row] = await db.insert(arrowRulesTable).values({
    ...parsed.data,
    numbers: parsed.data.numbers ?? [],
    is_active: parsed.data.is_active ?? true,
  }).returning();

  res.status(201).json(fmt(row));
});

router.patch("/loshu/arrows/:id", async (req, res) => {
  const parsed = UpdateArrowRuleParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = UpdateArrowRuleBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [row] = await db.update(arrowRulesTable)
    .set({ ...body.data, updated_at: new Date() })
    .where(eq(arrowRulesTable.id, parsed.data.id))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/loshu/arrows/:id", async (req, res) => {
  const parsed = DeleteArrowRuleParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(arrowRulesTable).where(eq(arrowRulesTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
