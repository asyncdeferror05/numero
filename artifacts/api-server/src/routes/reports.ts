import { Router } from "express";
import { db } from "@workspace/db";
import {
  rulesTable, missingNumberRulesTable, repeatedNumberRulesTable, arrowRulesTable,
  numberMeaningsTable, professionMappingsTable, healthMappingsTable,
  relationshipMappingsTable, remediesTable,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { GenerateReportBody } from "@workspace/api-zod";

const router = Router();

function reduceToSingleDigit(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((sum, d) => sum + Number(d), 0);
  }
  return n;
}

function sumDigits(n: number): number {
  return String(n).split("").reduce((sum, d) => sum + Number(d), 0);
}

function buildLoShuGrid(dob: Date) {
  const dobStr = [
    String(dob.getFullYear()),
    String(dob.getMonth() + 1).padStart(2, "0"),
    String(dob.getDate()).padStart(2, "0"),
  ].join("");

  const digitCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  for (const ch of dobStr) {
    const d = Number(ch);
    if (d >= 1 && d <= 9) digitCounts[d]++;
  }

  const grid = [
    [digitCounts[4], digitCounts[9], digitCounts[2]],
    [digitCounts[3], digitCounts[5], digitCounts[7]],
    [digitCounts[8], digitCounts[1], digitCounts[6]],
  ];

  const missingNumbers = Object.entries(digitCounts).filter(([, v]) => v === 0).map(([k]) => Number(k));
  const repeatedNumbers = Object.entries(digitCounts).filter(([, v]) => v > 1).map(([k, v]) => ({ number: Number(k), count: v }));

  return { grid, digitCounts, missingNumbers, repeatedNumbers };
}

function getActiveArrows(digitCounts: Record<number, number>) {
  const ARROWS = [
    { name: "Arrow of Determination", numbers: [1, 5, 9] },
    { name: "Arrow of Intellect", numbers: [3, 5, 7] },
    { name: "Arrow of Practicality", numbers: [1, 2, 3] },
    { name: "Arrow of Will Power", numbers: [7, 8, 9] },
    { name: "Arrow of Emotional Balance", numbers: [4, 5, 6] },
    { name: "Arrow of Activity", numbers: [2, 5, 8] },
    { name: "Arrow of Planner", numbers: [4, 3, 8] },
    { name: "Arrow of the Enquirer", numbers: [2, 7, 6] },
  ];
  return ARROWS.filter((a) => a.numbers.every((n) => (digitCounts[n] ?? 0) > 0)).map((a) => a.name);
}

const fmt = <T extends { created_at: Date; updated_at: Date }>(r: T) => ({
  ...r, created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString(),
});
const fmtTag = <T extends { created_at: Date }>(r: T) => ({
  ...r, created_at: r.created_at.toISOString(),
});

router.post("/reports/generate", async (req, res) => {
  const parsed = GenerateReportBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const { name, date_of_birth } = parsed.data;
  const dob = new Date(date_of_birth);
  if (isNaN(dob.getTime())) { res.status(400).json({ error: "Invalid date_of_birth" }); return; }

  const day = dob.getDate();
  const month = dob.getMonth() + 1;
  const year = dob.getFullYear();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const birthdayNumber = reduceToSingleDigit(day);
  const destinyNumber = reduceToSingleDigit(sumDigits(day) + sumDigits(month) + sumDigits(year));
  const personalYear = reduceToSingleDigit(sumDigits(day) + sumDigits(month) + sumDigits(currentYear));
  const personalMonth = reduceToSingleDigit(personalYear + currentMonth);
  const personalDay = reduceToSingleDigit(personalMonth + currentDay);

  // Fetch everything in parallel
  const [
    allRules, missingRulesDb, repeatedRulesDb, arrowRulesDb,
    allMeanings, allProfessions, allHealth, allRelationships, allRemedies,
  ] = await Promise.all([
    db.select().from(rulesTable).where(eq(rulesTable.is_active, true)),
    db.select().from(missingNumberRulesTable).where(eq(missingNumberRulesTable.is_active, true)),
    db.select().from(repeatedNumberRulesTable).where(eq(repeatedNumberRulesTable.is_active, true)),
    db.select().from(arrowRulesTable).where(eq(arrowRulesTable.is_active, true)),
    db.select().from(numberMeaningsTable),
    db.select().from(professionMappingsTable),
    db.select().from(healthMappingsTable),
    db.select().from(relationshipMappingsTable),
    db.select().from(remediesTable),
  ]);

  const numberMap: Record<string, number> = {
    birthday_number: birthdayNumber,
    destiny_number: destinyNumber,
    personal_year: personalYear,
    personal_month: personalMonth,
    personal_day: personalDay,
  };

  // Rule-based interpretations
  const interpretations = allRules
    .filter((rule) => {
      const cond = rule.condition_json as Record<string, unknown>;
      for (const [key, val] of Object.entries(cond)) {
        if (key in numberMap && numberMap[key] !== Number(val)) return false;
      }
      return true;
    })
    .map((rule) => {
      const result = rule.result_json as Record<string, unknown>;
      return {
        rule_id: rule.id,
        rule_name: rule.name,
        rule_type: rule.rule_type,
        keywords: (result.keywords as string[]) ?? [],
        strengths: (result.strengths as string[]) ?? [],
        weaknesses: (result.weaknesses as string[]) ?? [],
        recommendations: (result.recommendations as string[]) ?? [],
        description: rule.description ?? null,
      };
    });

  // Lo Shu
  const { grid, digitCounts, missingNumbers, repeatedNumbers } = buildLoShuGrid(dob);
  const activeArrows = getActiveArrows(digitCounts);
  const missingInterps = missingRulesDb.filter((r) => missingNumbers.includes(r.missing_number)).map(fmt);
  const repeatedInterps = repeatedRulesDb.filter((r) => repeatedNumbers.some((rn) => rn.number === r.number && rn.count >= r.count)).map(fmt);
  const arrowInterps = arrowRulesDb.filter((r) => activeArrows.includes(r.name)).map(fmt);

  // Helper: get meanings for a number + type
  const getMeanings = (num: number, type: string) => allMeanings.filter((m) => m.number === num && m.number_type === type).map(fmt);

  // ─── Personality Analysis ────────────────────────────────────────────────────
  const personalityMeanings = getMeanings(birthdayNumber, "personality");
  const personalityKeywords = personalityMeanings.flatMap((m) => m.keywords_json);
  const personality_analysis = {
    title: "Personality Analysis",
    number: birthdayNumber,
    meanings: personalityMeanings,
    summary: personalityMeanings[0]?.description || `Birthday Number ${birthdayNumber}: ${personalityKeywords.slice(0, 3).join(", ")}`,
  };

  // ─── Career Analysis ─────────────────────────────────────────────────────────
  const careerMeanings = getMeanings(destinyNumber, "destiny");
  const professions = allProfessions
    .filter((p) => p.number === destinyNumber)
    .sort((a, b) => b.weight - a.weight)
    .map(fmt);
  const career_analysis = {
    title: "Career Analysis",
    number: destinyNumber,
    professions,
    meanings: careerMeanings,
    summary: careerMeanings[0]?.description || `Destiny Number ${destinyNumber} — ${professions.map((p) => p.profession).slice(0, 3).join(", ")}`,
  };

  // ─── Relationship Analysis ────────────────────────────────────────────────────
  const relMeanings = getMeanings(birthdayNumber, "birthday");
  const relMappings = allRelationships.filter((r) => r.number === birthdayNumber).map(fmt);
  const relationship_analysis = {
    title: "Relationship Analysis",
    number: birthdayNumber,
    mappings: relMappings,
    meanings: relMeanings,
    summary: relMappings[0]?.interpretation || relMeanings[0]?.description || `Birthday Number ${birthdayNumber} in relationships`,
  };

  // ─── Health Analysis ──────────────────────────────────────────────────────────
  const healthMeanings = getMeanings(birthdayNumber, "birthday");
  const healthAreas = allHealth.filter((h) => h.number === birthdayNumber).map(fmt);
  const health_analysis = {
    title: "Health Analysis",
    number: birthdayNumber,
    health_areas: healthAreas,
    meanings: healthMeanings,
    summary: healthAreas.map((h) => `${h.health_area} (${h.severity})`).join("; ") || `Health focus for number ${birthdayNumber}`,
  };

  // ─── Money Analysis ───────────────────────────────────────────────────────────
  const moneyMeanings = getMeanings(destinyNumber, "destiny");
  const moneyRuleInterps = interpretations.filter((i) => ["personal_year", "destiny_number"].includes(i.rule_type));
  const money_analysis = {
    title: "Money Analysis",
    number: destinyNumber,
    meanings: moneyMeanings,
    summary: moneyMeanings[0]?.description || `Financial outlook for Destiny Number ${destinyNumber}`,
  };

  // ─── Travel Analysis ──────────────────────────────────────────────────────────
  const travelMeanings = getMeanings(personalYear, "personal_year");
  const travel_analysis = {
    title: "Travel & Movement",
    number: personalYear,
    meanings: travelMeanings,
    summary: travelMeanings[0]?.description || `Personal Year ${personalYear}: ${travelMeanings[0]?.keywords_json.slice(0, 3).join(", ") || "movement and change"}`,
  };

  // ─── Remedies ─────────────────────────────────────────────────────────────────
  // Pull remedies relevant to identified weaknesses (pick up to 5)
  const relevantRemedies = allRemedies.slice(0, 5).map(fmt);

  // ─── Future Predictions ──────────────────────────────────────────────────────
  const yearMeanings = getMeanings(personalYear, "personal_year");
  const monthMeanings = getMeanings(personalMonth, "personal_month");
  const futureInterps = interpretations.filter((i) => ["personal_year", "personal_month", "personal_day"].includes(i.rule_type));
  const future_predictions = {
    personal_year: personalYear,
    personal_month: personalMonth,
    personal_day: personalDay,
    year_meaning: yearMeanings,
    month_meaning: monthMeanings,
    interpretations: futureInterps,
  };

  res.json({
    subject: { name, date_of_birth },
    numbers: {
      birthday_number: birthdayNumber,
      destiny_number: destinyNumber,
      personality_number: null,
      personal_year: personalYear,
      personal_month: personalMonth,
      personal_day: personalDay,
    },
    personality_analysis,
    career_analysis,
    relationship_analysis,
    health_analysis,
    money_analysis,
    travel_analysis,
    remedies: relevantRemedies,
    future_predictions,
    lo_shu: {
      grid,
      missing_numbers: missingNumbers,
      repeated_numbers: repeatedNumbers,
      active_arrows: activeArrows,
      missing_interpretations: missingInterps,
      repeated_interpretations: repeatedInterps,
      arrow_interpretations: arrowInterps,
    },
    interpretations,
    generated_at: new Date().toISOString(),
  });
});

export default router;
