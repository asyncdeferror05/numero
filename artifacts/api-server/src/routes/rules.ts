import { Router } from "express";
import { db } from "@workspace/db";
import { rulesTable } from "@workspace/db";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import {
  CreateRuleBody,
  UpdateRuleBody,
  ListRulesQueryParams,
} from "@workspace/api-zod";

const router = Router();

const RULE_TYPES = [
  "personality_number",
  "birthday_number",
  "destiny_number",
  "personal_year",
  "personal_month",
  "personal_day",
  "lo_shu",
  "missing_number",
  "repeated_number",
  "combination",
  "compatibility",
  "vehicle_number",
  "phone_number",
  "house_number",
  "remedy",
  "custom",
];

router.get("/rules/types", (req, res) => {
  res.json(RULE_TYPES);
});

router.get("/rules", async (req, res) => {
  const parsed = ListRulesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { rule_type, is_active, search } = parsed.data;
  const conditions: SQL[] = [];

  if (rule_type) conditions.push(eq(rulesTable.rule_type, rule_type));
  if (is_active !== undefined) conditions.push(eq(rulesTable.is_active, is_active));
  if (search) conditions.push(ilike(rulesTable.name, `%${search}%`));

  const rules = await db
    .select()
    .from(rulesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(rulesTable.priority, rulesTable.created_at);

  res.json(rules.map((r) => ({ ...r, created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString() })));
});

router.post("/rules", async (req, res) => {
  const parsed = CreateRuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const [rule] = await db.insert(rulesTable).values({
    ...parsed.data,
    priority: parsed.data.priority ?? 100,
    is_active: parsed.data.is_active ?? true,
  }).returning();

  res.status(201).json({ ...rule, created_at: rule.created_at.toISOString(), updated_at: rule.updated_at.toISOString() });
});

router.get("/rules/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [rule] = await db.select().from(rulesTable).where(eq(rulesTable.id, id));
  if (!rule) { res.status(404).json({ error: "Not found" }); return; }

  res.json({ ...rule, created_at: rule.created_at.toISOString(), updated_at: rule.updated_at.toISOString() });
});

router.patch("/rules/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateRuleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [rule] = await db.update(rulesTable)
    .set({ ...parsed.data, updated_at: new Date() })
    .where(eq(rulesTable.id, id))
    .returning();

  if (!rule) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...rule, created_at: rule.created_at.toISOString(), updated_at: rule.updated_at.toISOString() });
});

router.delete("/rules/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(rulesTable).where(eq(rulesTable.id, id));
  res.status(204).send();
});

router.patch("/rules/:id/toggle", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(rulesTable).where(eq(rulesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const [rule] = await db.update(rulesTable)
    .set({ is_active: !existing.is_active, updated_at: new Date() })
    .where(eq(rulesTable.id, id))
    .returning();

  res.json({ ...rule, created_at: rule.created_at.toISOString(), updated_at: rule.updated_at.toISOString() });
});

export default router;
