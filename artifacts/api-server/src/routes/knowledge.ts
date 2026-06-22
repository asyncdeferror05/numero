import { Router } from "express";
import { db } from "@workspace/db";
import { knowledgeEntriesTable } from "@workspace/db";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import { CreateKnowledgeEntryBody, UpdateKnowledgeEntryBody, ListKnowledgeEntriesQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/knowledge-entries", async (req, res) => {
  const parsed = ListKnowledgeEntriesQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query" }); return; }

  const { category, search } = parsed.data;
  const conditions: SQL[] = [];

  if (category) conditions.push(eq(knowledgeEntriesTable.category, category));
  if (search) conditions.push(ilike(knowledgeEntriesTable.title, `%${search}%`));

  const entries = await db.select().from(knowledgeEntriesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(knowledgeEntriesTable.created_at);

  res.json(entries.map((e) => ({ ...e, created_at: e.created_at.toISOString(), updated_at: e.updated_at.toISOString() })));
});

router.post("/knowledge-entries", async (req, res) => {
  const parsed = CreateKnowledgeEntryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [entry] = await db.insert(knowledgeEntriesTable).values({
    ...parsed.data,
    tags: parsed.data.tags ?? [],
    is_published: parsed.data.is_published ?? false,
  }).returning();

  res.status(201).json({ ...entry, created_at: entry.created_at.toISOString(), updated_at: entry.updated_at.toISOString() });
});

router.get("/knowledge-entries/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [entry] = await db.select().from(knowledgeEntriesTable).where(eq(knowledgeEntriesTable.id, id));
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...entry, created_at: entry.created_at.toISOString(), updated_at: entry.updated_at.toISOString() });
});

router.patch("/knowledge-entries/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateKnowledgeEntryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [entry] = await db.update(knowledgeEntriesTable)
    .set({ ...parsed.data, updated_at: new Date() })
    .where(eq(knowledgeEntriesTable.id, id))
    .returning();

  if (!entry) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...entry, created_at: entry.created_at.toISOString(), updated_at: entry.updated_at.toISOString() });
});

router.delete("/knowledge-entries/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(knowledgeEntriesTable).where(eq(knowledgeEntriesTable.id, id));
  res.status(204).send();
});

export default router;
