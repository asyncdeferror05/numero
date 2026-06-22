import { Router } from "express";
import { db } from "@workspace/db";
import { rulesTable, formulasTable, missingNumberRulesTable, repeatedNumberRulesTable, arrowRulesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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

function buildLoShuGrid(dob: Date): {
  grid: number[][];
  digitCounts: Record<number, number>;
  missingNumbers: number[];
  repeatedNumbers: Array<{ number: number; count: number }>;
} {
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

  // Lo Shu grid layout: positions 4,9,2 / 3,5,7 / 8,1,6
  const grid = [
    [digitCounts[4], digitCounts[9], digitCounts[2]],
    [digitCounts[3], digitCounts[5], digitCounts[7]],
    [digitCounts[8], digitCounts[1], digitCounts[6]],
  ];

  const missingNumbers = Object.entries(digitCounts)
    .filter(([, v]) => v === 0)
    .map(([k]) => Number(k));

  const repeatedNumbers = Object.entries(digitCounts)
    .filter(([, v]) => v > 1)
    .map(([k, v]) => ({ number: Number(k), count: v }));

  return { grid, digitCounts, missingNumbers, repeatedNumbers };
}

function getActiveArrows(digitCounts: Record<number, number>): string[] {
  const ARROWS: Array<{ name: string; numbers: number[] }> = [
    { name: "Arrow of Determination", numbers: [1, 5, 9] },
    { name: "Arrow of Intellect", numbers: [3, 5, 7] },
    { name: "Arrow of Practicality", numbers: [1, 2, 3] },
    { name: "Arrow of Will Power", numbers: [7, 8, 9] },
    { name: "Arrow of Emotional Balance", numbers: [4, 5, 6] },
    { name: "Arrow of Activity", numbers: [2, 5, 8] },
    { name: "Arrow of Planner", numbers: [4, 3, 8] },
    { name: "Arrow of the Enquirer", numbers: [2, 7, 6] },
  ];
  return ARROWS
    .filter((a) => a.numbers.every((n) => (digitCounts[n] ?? 0) > 0))
    .map((a) => a.name);
}

router.post("/reports/generate", async (req, res) => {
  const parsed = GenerateReportBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const { name, date_of_birth } = parsed.data;
  const dob = new Date(date_of_birth);

  if (isNaN(dob.getTime())) {
    res.status(400).json({ error: "Invalid date_of_birth" });
    return;
  }

  const day = dob.getDate();
  const month = dob.getMonth() + 1;
  const year = dob.getFullYear();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();

  const birthdayNumber = reduceToSingleDigit(day);
  const destinyNumber = reduceToSingleDigit(sumDigits(day) + sumDigits(month) + sumDigits(year));
  const personalYear = reduceToSingleDigit(sumDigits(day) + sumDigits(month) + sumDigits(currentYear));
  const personalMonth = reduceToSingleDigit(personalYear + currentMonth);
  const personalDay = reduceToSingleDigit(personalMonth + currentDay);

  // Fetch active rules and match conditions
  const [allRules, missingRules, repeatedRules, arrowRulesDb] = await Promise.all([
    db.select().from(rulesTable).where(eq(rulesTable.is_active, true)),
    db.select().from(missingNumberRulesTable).where(eq(missingNumberRulesTable.is_active, true)),
    db.select().from(repeatedNumberRulesTable).where(eq(repeatedNumberRulesTable.is_active, true)),
    db.select().from(arrowRulesTable).where(eq(arrowRulesTable.is_active, true)),
  ]);

  const fmt = <T extends { created_at: Date; updated_at: Date }>(r: T) => ({
    ...r,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  });

  const numberMap: Record<string, number> = {
    birthday_number: birthdayNumber,
    destiny_number: destinyNumber,
    personal_year: personalYear,
    personal_month: personalMonth,
    personal_day: personalDay,
  };

  const interpretations = allRules
    .filter((rule) => {
      const cond = rule.condition_json as Record<string, unknown>;
      for (const [key, val] of Object.entries(cond)) {
        if (key in numberMap) {
          if (numberMap[key] !== Number(val)) return false;
        }
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

  const { grid, digitCounts, missingNumbers, repeatedNumbers } = buildLoShuGrid(dob);
  const activeArrows = getActiveArrows(digitCounts);

  // Match Lo Shu rules from DB
  const missingInterps = missingRules
    .filter((r) => missingNumbers.includes(r.missing_number))
    .map(fmt);

  const repeatedInterps = repeatedRules
    .filter((r) => repeatedNumbers.some((rn) => rn.number === r.number && rn.count >= r.count))
    .map(fmt);

  const arrowInterps = arrowRulesDb
    .filter((r) => activeArrows.includes(r.name))
    .map(fmt);

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
    interpretations,
    lo_shu: {
      grid,
      missing_numbers: missingNumbers,
      repeated_numbers: repeatedNumbers,
      active_arrows: activeArrows,
      missing_interpretations: missingInterps,
      repeated_interpretations: repeatedInterps,
      arrow_interpretations: arrowInterps,
    },
    generated_at: new Date().toISOString(),
  });
});

export default router;
