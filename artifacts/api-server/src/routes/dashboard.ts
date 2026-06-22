import { Router } from "express";
import { db } from "@workspace/db";
import {
  rulesTable, formulasTable, knowledgeEntriesTable,
  missingNumberRulesTable, repeatedNumberRulesTable, arrowRulesTable,
  numberMeaningsTable,
} from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", async (_req, res) => {
  const [
    totalRulesResult, activeRulesResult,
    totalFormulasResult, activeFormulasResult,
    totalKnowledgeResult,
    missingCount, repeatedCount, arrowCount,
    totalMeaningsResult,
    rulesByTypeResult, recentRulesResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(rulesTable),
    db.select({ count: count() }).from(rulesTable).where(eq(rulesTable.is_active, true)),
    db.select({ count: count() }).from(formulasTable),
    db.select({ count: count() }).from(formulasTable).where(eq(formulasTable.is_active, true)),
    db.select({ count: count() }).from(knowledgeEntriesTable),
    db.select({ count: count() }).from(missingNumberRulesTable),
    db.select({ count: count() }).from(repeatedNumberRulesTable),
    db.select({ count: count() }).from(arrowRulesTable),
    db.select({ count: count() }).from(numberMeaningsTable),
    db.select({ type: rulesTable.rule_type, count: count() }).from(rulesTable).groupBy(rulesTable.rule_type),
    db.select().from(rulesTable).orderBy(sql`${rulesTable.created_at} DESC`).limit(5),
  ]);

  res.json({
    totalRules: totalRulesResult[0].count,
    activeRules: activeRulesResult[0].count,
    totalFormulas: totalFormulasResult[0].count,
    activeFormulas: activeFormulasResult[0].count,
    totalKnowledgeEntries: totalKnowledgeResult[0].count,
    totalLoShuRules: Number(missingCount[0].count) + Number(repeatedCount[0].count) + Number(arrowCount[0].count),
    totalNumberMeanings: totalMeaningsResult[0].count,
    rulesByType: rulesByTypeResult.map((r) => ({ type: r.type, count: Number(r.count) })),
    recentRules: recentRulesResult.map((r) => ({
      ...r,
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
    })),
  });
});

export default router;
