import { Router } from "express";
import { db } from "@workspace/db";
import {
  rulesTable, missingNumberRulesTable, repeatedNumberRulesTable, arrowRulesTable,
  formulasTable, numberMeaningsTable, professionMappingsTable, healthMappingsTable,
  relationshipMappingsTable, remediesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { GenerateReportBody } from "@workspace/api-zod";
import { evaluateFormula, buildContext } from "../lib/formula-engine.js";

const router = Router();

// ─── Fallback arithmetic helpers (used when no active DB formula exists) ──────

function reduceToSingleDigit(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

// Full reduction with no master-number preservation — used for personal
// year/month/day, which are always expressed as a single digit 0-9.
function reduceFull(n: number): number {
  n = Math.abs(Math.round(n));
  while (n > 9) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

function sumDigits(n: number): number {
  return String(n).split("").reduce((s, d) => s + Number(d), 0);
}

const REPEAT_LABELS: Record<number, string> = { 2: "Double", 3: "Triple", 4: "Quadruple", 5: "Quintuple" };

function buildLoShuGrid(dob: Date, destinyNumber: number) {
  const dobStr = [
    String(dob.getFullYear()),
    String(dob.getMonth() + 1).padStart(2, "0"),
    String(dob.getDate()).padStart(2, "0"),
  ].join("");

  // Build digit pool: DOB digits + destiny number
  const digitPool: number[] = [];
  for (const ch of dobStr) {
    digitPool.push(Number(ch));
  }
  if (destinyNumber >= 1 && destinyNumber <= 9) digitPool.push(destinyNumber);

  const digitCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  for (const d of digitPool) {
    if (d >= 1 && d <= 9) digitCounts[d]++;
  }

  // Standard Lo Shu grid layout: 4|9|2 / 3|5|7 / 8|1|6
  const grid = [
    [digitCounts[4], digitCounts[9], digitCounts[2]],
    [digitCounts[3], digitCounts[5], digitCounts[7]],
    [digitCounts[8], digitCounts[1], digitCounts[6]],
  ];

  const missingNumbers = Object.entries(digitCounts)
    .filter(([, v]) => v === 0)
    .map(([k]) => Number(k))
    .sort((a, b) => a - b);

  const repeatedNumbers = Object.entries(digitCounts)
    .filter(([, v]) => v > 1)
    .map(([k, v]) => ({
      number: Number(k),
      count: v,
      label: REPEAT_LABELS[v] ?? `×${v}`,
    }))
    .sort((a, b) => b.count - a.count);

  return { digitPool, grid, digitCounts, missingNumbers, repeatedNumbers };
}

// Astro Numero grid — built only from day, month, and the last two digits of
// the birth year (never the full 4-digit year, never destiny/other numbers).
// Duplicate digits collapse: a number that appears twice is still mentioned
// only once.
const ASTRO_NUMERO_LAYOUT = [
  [3, 1, 9],
  [6, 7, 5],
  [2, 8, 4],
];

function buildAstroNumeroGrid(dob: Date) {
  const dd = String(dob.getDate()).padStart(2, "0");
  const mm = String(dob.getMonth() + 1).padStart(2, "0");
  const yy = String(dob.getFullYear() % 100).padStart(2, "0");
  const rawDigits = `${dd}${mm}${yy}`.split("").map(Number);

  const digitPool = Array.from(new Set(rawDigits.filter((d) => d >= 1 && d <= 9))).sort((a, b) => a - b);
  const present = new Set(digitPool);

  const grid = ASTRO_NUMERO_LAYOUT.map((row) => row.map((n) => (present.has(n) ? n : 0)));
  const missingNumbers = ASTRO_NUMERO_LAYOUT.flat().filter((n) => !present.has(n)).sort((a, b) => a - b);

  return { digitPool, grid, missingNumbers };
}

function getActiveArrows(
  digitCounts: Record<number, number>,
  dbArrows: Array<{ name: string; numbers: number[] }>,
) {
  return dbArrows
    .filter((a) => a.numbers.every((n) => (digitCounts[n] ?? 0) > 0))
    .map((a) => a.name);
}

const fmt = <T extends { created_at: Date; updated_at: Date }>(r: T) => ({
  ...r, created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString(),
});

router.post("/reports/generate", async (req, res) => {
  const parsed = GenerateReportBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const { name, date_of_birth, year_offset } = parsed.data;
  const dob = new Date(date_of_birth);
  if (isNaN(dob.getTime())) { res.status(400).json({ error: "Invalid date_of_birth" }); return; }

  const yearOffset = year_offset ?? 0;
  const rawToday = new Date();
  // Shift "today" by whole years to preview a future/past personal year,
  // month & day cycle (transpose) without changing the DOB.
  const today = new Date(rawToday.getFullYear() + yearOffset, rawToday.getMonth(), rawToday.getDate());
  const day = dob.getDate();
  const month = dob.getMonth() + 1;
  const year = dob.getFullYear();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // ─── Load active formulas from DB ──────────────────────────────────────────
  const [
    activeFormulas,
    allRules, missingRulesDb, repeatedRulesDb, arrowRulesDb,
    allMeanings, allProfessions, allHealth, allRelationships, allRemedies,
  ] = await Promise.all([
    db.select().from(formulasTable).where(eq(formulasTable.is_active, true)),
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

  // Build formula map: type → active formula expression
  const formulaMap = Object.fromEntries(activeFormulas.map((f) => [f.formula_type, f.formula_expression]));

  // Base context — available to all formula evaluations
  const baseCtx = buildContext(dob, name, "", today);

  // Evaluate a formula type, falling back to provided default
  function evalFormula(type: string, fallback: number): number {
    const expr = formulaMap[type];
    if (!expr) return fallback;
    const { result } = evaluateFormula(expr, { ...baseCtx });
    return result ?? fallback;
  }

  // ─── Compute core numbers ──────────────────────────────────────────────────
  const birthdayNumber = evalFormula(
    "birthday_number",
    reduceToSingleDigit(day),
  );

  const destinyNumber = evalFormula(
    "destiny_number",
    reduceToSingleDigit(sumDigits(day) + sumDigits(month) + sumDigits(year)),
  );

  const personalityNumber = evalFormula(
    "personality_number",
    0, // no fallback — requires name
  );

  // Personal Year: DOB day + DOB month + birthday-anchored cycle year + the
  // numerology day-number of the weekday the birthday fell on this cycle —
  // fully reduced to a single digit 0-9.
  const personalYear = evalFormula(
    "personal_year",
    reduceFull(sumDigits(day) + sumDigits(month) + sumDigits(baseCtx.cycleYear) + baseCtx.birthdayWeekday),
  );

  // Personal Month: DOB day + DOB month + DOB year + current year + number
  // of months elapsed since the last birthday.
  const personalMonth = evalFormula(
    "personal_month",
    reduceFull(sumDigits(day) + sumDigits(month) + sumDigits(year) + sumDigits(currentYear) + baseCtx.monthsSinceLastBirthday),
  );

  // Personal Day: DOB day + DOB month + DOB year + current date + current
  // month + cycle year + the numerology day-number of today's weekday.
  const personalDay = evalFormula(
    "personal_day",
    reduceFull(sumDigits(day) + sumDigits(month) + sumDigits(year) + sumDigits(currentDay) + sumDigits(currentMonth) + sumDigits(baseCtx.cycleYear) + baseCtx.todayWeekday),
  );

  const numberMap: Record<string, number> = {
    birthday_number: birthdayNumber,
    destiny_number: destinyNumber,
    personal_year: personalYear,
    personal_month: personalMonth,
    personal_day: personalDay,
  };

  // ─── Rule-based interpretations ────────────────────────────────────────────
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

  // ─── Lo Shu ────────────────────────────────────────────────────────────────
  const { digitPool, grid, digitCounts, missingNumbers, repeatedNumbers } = buildLoShuGrid(dob, destinyNumber);
  const activeArrows = getActiveArrows(digitCounts, arrowRulesDb);
  const astroNumero = buildAstroNumeroGrid(dob);
  const missingInterps = missingRulesDb.filter((r) => missingNumbers.includes(r.missing_number)).map(fmt);
  const repeatedInterps = repeatedRulesDb.filter((r) => repeatedNumbers.some((rn) => rn.number === r.number && rn.count >= r.count)).map(fmt);
  const arrowInterps = arrowRulesDb.filter((r) => activeArrows.includes(r.name)).map(fmt);

  const getMeanings = (num: number, type: string) => allMeanings.filter((m) => m.number === num && m.number_type === type).map(fmt);

  // ─── 8 analysis sections ───────────────────────────────────────────────────
  const personalityMeanings = getMeanings(birthdayNumber, "personality");
  const personality_analysis = {
    title: "Personality Analysis",
    number: birthdayNumber,
    personality_number: personalityNumber || null,
    formula_used: formulaMap["birthday_number"] ?? null,
    meanings: personalityMeanings,
    summary: personalityMeanings[0]?.description || `Birthday Number ${birthdayNumber}`,
  };

  const careerMeanings = getMeanings(destinyNumber, "destiny");
  const professions = allProfessions.filter((p) => p.number === destinyNumber).sort((a, b) => b.weight - a.weight).map(fmt);
  const career_analysis = {
    title: "Career Analysis",
    number: destinyNumber,
    formula_used: formulaMap["destiny_number"] ?? null,
    professions,
    meanings: careerMeanings,
    summary: careerMeanings[0]?.description || `Destiny Number ${destinyNumber}`,
  };

  const relMappings = allRelationships.filter((r) => r.number === birthdayNumber).map(fmt);
  const relationship_analysis = {
    title: "Relationship Analysis",
    number: birthdayNumber,
    mappings: relMappings,
    meanings: getMeanings(birthdayNumber, "birthday"),
    summary: relMappings[0]?.interpretation || `Birthday Number ${birthdayNumber} in relationships`,
  };

  const healthAreas = allHealth.filter((h) => h.number === birthdayNumber).map(fmt);
  const health_analysis = {
    title: "Health Analysis",
    number: birthdayNumber,
    health_areas: healthAreas,
    meanings: getMeanings(birthdayNumber, "birthday"),
    summary: healthAreas.map((h) => `${h.health_area} (${h.severity})`).join("; ") || `Health focus for number ${birthdayNumber}`,
  };

  const moneyMeanings = getMeanings(destinyNumber, "destiny");
  const money_analysis = {
    title: "Money Analysis",
    number: destinyNumber,
    meanings: moneyMeanings,
    summary: moneyMeanings[0]?.description || `Financial outlook for Destiny Number ${destinyNumber}`,
  };

  const travelMeanings = getMeanings(personalYear, "personal_year");
  const travel_analysis = {
    title: "Travel & Movement",
    number: personalYear,
    formula_used: formulaMap["personal_year"] ?? null,
    meanings: travelMeanings,
    summary: travelMeanings[0]?.description || `Personal Year ${personalYear}`,
  };

  const relevantRemedies = allRemedies.slice(0, 5).map(fmt);

  const yearMeanings = getMeanings(personalYear, "personal_year");
  const monthMeanings = getMeanings(personalMonth, "personal_month");
  const future_predictions = {
    personal_year: personalYear,
    personal_month: personalMonth,
    personal_day: personalDay,
    year_meaning: yearMeanings,
    month_meaning: monthMeanings,
    interpretations: interpretations.filter((i) => ["personal_year", "personal_month", "personal_day"].includes(i.rule_type)),
  };

  res.json({
    subject: { name, date_of_birth },
    year_offset: yearOffset,
    numbers: {
      birthday_number: birthdayNumber,
      destiny_number: destinyNumber,
      personality_number: personalityNumber || null,
      personal_year: personalYear,
      personal_month: personalMonth,
      personal_day: personalDay,
      cycle_year: baseCtx.cycleYear,
    },
    formulas_used: Object.fromEntries(
      activeFormulas.map((f) => [f.formula_type, { name: f.name, version: f.version, expression: f.formula_expression }]),
    ),
    personality_analysis,
    career_analysis,
    relationship_analysis,
    health_analysis,
    money_analysis,
    travel_analysis,
    remedies: relevantRemedies,
    future_predictions,
    lo_shu: {
      digit_pool: digitPool,
      grid,
      missing_numbers: missingNumbers,
      repeated_numbers: repeatedNumbers,
      active_arrows: activeArrows,
      missing_interpretations: missingInterps,
      repeated_interpretations: repeatedInterps,
      arrow_interpretations: arrowInterps,
    },
    astro_numero: {
      digit_pool: astroNumero.digitPool,
      grid: astroNumero.grid,
      missing_numbers: astroNumero.missingNumbers,
    },
    interpretations,
    generated_at: new Date().toISOString(),
  });
});

export default router;
