import { randomInt as cryptoRandomInt } from "crypto";

/**
 * Formula Engine — dynamic expression evaluator for numerology calculations.
 *
 * Formulas are stored as text expressions in the database.
 * The engine evaluates them with a sandboxed context of helper functions
 * and input variables.
 *
 * Available context variables:
 *   day, month, year          — DOB parts
 *   currentYear, currentMonth, currentDay — today (or the offset "as of" date)
 *   name                      — full name string
 *   extraInput                — vehicle/phone/house number string
 *   cycleYear                 — birthday-anchored cycle year (resets on the birthday, not Jan 1)
 *   monthsSinceLastBirthday   — number of calendar months since the last birthday occurred
 *   birthdayWeekday           — numerology day-number of the weekday the birthday fell on this cycle
 *   todayWeekday              — numerology day-number of the current date's weekday
 *
 * Available functions:
 *   reduce(n)                 — reduce to single digit, keep master numbers 11 22 33
 *   reduceAll(n)              — force reduce, no master numbers
 *   sumDigits(n)              — sum all digits of a number or numeric string
 *   pythagorean(str)          — Pythagorean name number (A=1..Z=8, cycle 1-9)
 *   pythagoreanVowels(str)    — vowels only (Soul Urge)
 *   pythagoreanConsonants(str)— consonants only (Personality)
 *   chaldean(str)             — Chaldean name number
 *   lettersOnly(str)          — strips non-alpha chars
 *   digitsOnly(str)           — strips non-digit chars
 *   weekdayValue(dayIndex)    — numerology day-number for a JS weekday index (0=Sun..6=Sat)
 */

export interface FormulaContext {
  day: number;
  month: number;
  year: number;
  name: string;
  currentYear: number;
  currentMonth: number;
  currentDay: number;
  extraInput: string;
  cycleYear: number;
  monthsSinceLastBirthday: number;
  birthdayWeekday: number;
  todayWeekday: number;
  [key: string]: unknown;
}

const PYTHAGOREAN: Record<string, number> = {
  a: 1, j: 1, s: 1,
  b: 2, k: 2, t: 2,
  c: 3, l: 3, u: 3,
  d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5,
  f: 6, o: 6, x: 6,
  g: 7, p: 7, y: 7,
  h: 8, q: 8, z: 8,
  i: 9, r: 9,
};

const CHALDEAN: Record<string, number> = {
  a: 1, i: 1, j: 1, q: 1, y: 1,
  b: 2, k: 2, r: 2,
  c: 3, g: 3, l: 3, s: 3,
  d: 4, m: 4, t: 4,
  e: 5, h: 5, n: 5, x: 5,
  u: 6, v: 6, w: 6,
  o: 7, z: 7,
  f: 8, p: 8,
};

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

// Numerology day-numbers, indexed by JS Date#getDay() (0=Sunday .. 6=Saturday).
const WEEKDAY_NUMBERS = [1, 2, 9, 5, 3, 6, 8];

function reduceToSingleDigit(n: number): number {
  n = Math.abs(Math.round(n));
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

function reduceAll(n: number): number {
  n = Math.abs(Math.round(n));
  while (n > 9) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

function sumDigits(n: number | string): number {
  return String(n).split("").reduce((s, c) => s + (isNaN(Number(c)) ? 0 : Number(c)), 0);
}

function pythagorean(str: string): number {
  return str.toLowerCase().split("").reduce((s, c) => s + (PYTHAGOREAN[c] ?? 0), 0);
}

function pythagoreanVowels(str: string): number {
  return str.toLowerCase().split("").reduce((s, c) => s + (VOWELS.has(c) ? (PYTHAGOREAN[c] ?? 0) : 0), 0);
}

function pythagoreanConsonants(str: string): number {
  return str.toLowerCase().split("").reduce((s, c) => {
    if (c === " ") return s;
    return s + (!VOWELS.has(c) ? (PYTHAGOREAN[c] ?? 0) : 0);
  }, 0);
}

function chaldean(str: string): number {
  return str.toLowerCase().split("").reduce((s, c) => s + (CHALDEAN[c] ?? 0), 0);
}

function lettersOnly(str: string): string {
  return str.replace(/[^a-zA-Z]/g, "");
}

function digitsOnly(str: string): number {
  return Number(str.replace(/\D/g, "") || "0");
}

/** Numerology day-number for a JS weekday index (0=Sunday..6=Saturday). */
function weekdayValue(dayIndex: number): number {
  const idx = ((Math.round(dayIndex) % 7) + 7) % 7;
  return WEEKDAY_NUMBERS[idx];
}

/** Numerology day-number for a given Date's weekday. */
function weekdayNumberOf(date: Date): number {
  return WEEKDAY_NUMBERS[date.getDay()];
}

/**
 * Cryptographically-secure, unbiased random integer in [min, max] inclusive.
 * Uses Node's crypto.randomInt (rejection sampling under the hood), so every
 * value in range has exactly equal probability — no modulo bias.
 */
function randomInt(min: number, max: number): number {
  const lo = Math.ceil(Math.min(min, max));
  const hi = Math.floor(Math.max(min, max));
  return cryptoRandomInt(lo, hi + 1);
}

const SAFE_FN_NAMES = [
  "reduce", "reduceAll", "sumDigits", "pythagorean",
  "pythagoreanVowels", "pythagoreanConsonants", "chaldean",
  "lettersOnly", "digitsOnly", "weekdayValue", "randomInt",
];

/**
 * Evaluate a formula expression against the given context.
 * Returns { result, error }.
 */
export function evaluateFormula(expression: string, ctx: FormulaContext): { result: number | null; error?: string } {
  try {
    const helpers = {
      reduce: reduceToSingleDigit,
      reduceAll,
      sumDigits,
      pythagorean,
      pythagoreanVowels,
      pythagoreanConsonants,
      chaldean,
      lettersOnly,
      digitsOnly,
      weekdayValue,
      randomInt,
    };

    const allVars = { ...ctx, ...helpers };
    const argNames = Object.keys(allVars);
    const argValues = Object.values(allVars);

    // Validate expression doesn't access disallowed globals
    const disallowed = ["process", "require", "import", "eval", "Function", "global", "globalThis", "fetch", "XMLHttpRequest"];
    for (const word of disallowed) {
      if (expression.includes(word)) {
        return { result: null, error: `Expression contains disallowed keyword: ${word}` };
      }
    }

    // eslint-disable-next-line no-new-func
    const fn = new Function(...argNames, `"use strict"; return (${expression});`);
    const raw = fn(...argValues);

    if (raw === null || raw === undefined) return { result: null };
    const num = Number(raw);
    if (isNaN(num)) return { result: null, error: "Expression did not return a number" };
    return { result: Math.round(num) };
  } catch (err: unknown) {
    return { result: null, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Build the default context for a given DOB and name.
 * Extra pre-computed values (like personalYear) can be merged in.
 *
 * `today` may be shifted by the caller (e.g. +/-1 year) to preview a
 * different personal year/month/day cycle without changing the DOB.
 */
export function buildContext(
  dob: Date,
  name = "",
  extraInput = "",
  today = new Date(),
  extra: Record<string, unknown> = {},
): FormulaContext {
  const day = dob.getDate();
  const month = dob.getMonth() + 1;
  const year = dob.getFullYear();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // The personal-year clock resets on the birthday, not Jan 1. If this
  // year's birthday hasn't happened yet (as of `today`), the active cycle
  // year is still last year's.
  const birthdayPassed = currentMonth > month || (currentMonth === month && currentDay >= day);
  const cycleYear = birthdayPassed ? currentYear : currentYear - 1;
  const lastBirthday = new Date(cycleYear, month - 1, day);
  const monthsSinceLastBirthday = (currentYear * 12 + currentMonth) - (cycleYear * 12 + month);
  const birthdayWeekday = weekdayNumberOf(lastBirthday);
  const todayWeekday = weekdayNumberOf(today);

  return {
    day,
    month,
    year,
    name,
    currentYear,
    currentMonth,
    currentDay,
    extraInput,
    cycleYear,
    monthsSinceLastBirthday,
    birthdayWeekday,
    todayWeekday,
    ...extra,
  };
}

/**
 * Human-readable descriptions of all DSL functions and variables.
 * Exposed via API for use in the formula builder UI.
 */
export const DSL_REFERENCE = {
  variables: [
    { name: "day", description: "Day of birth (1–31)" },
    { name: "month", description: "Month of birth (1–12)" },
    { name: "year", description: "Full birth year (e.g. 1990)" },
    { name: "name", description: "Full name string" },
    { name: "currentYear", description: "Current year (or the offset 'as of' year)" },
    { name: "currentMonth", description: "Current month (1–12)" },
    { name: "currentDay", description: "Current day (1–31)" },
    { name: "extraInput", description: "Extra input — vehicle/phone/house number" },
    { name: "cycleYear", description: "Birthday-anchored cycle year — equals currentYear if this year's birthday already happened, otherwise currentYear - 1" },
    { name: "monthsSinceLastBirthday", description: "Number of calendar months elapsed since the last birthday occurred" },
    { name: "birthdayWeekday", description: "Numerology day-number (Sun=1, Mon=2, Tue=9, Wed=5, Thu=3, Fri=6, Sat=8) of the weekday the last birthday fell on" },
    { name: "todayWeekday", description: "Numerology day-number of the current date's weekday" },
  ],
  functions: [
    { name: "reduce(n)", description: "Reduce number to single digit, preserving master numbers 11, 22, 33" },
    { name: "reduceAll(n)", description: "Force reduce to single digit (0-9), ignoring master numbers" },
    { name: "sumDigits(n)", description: "Sum all digits of a number (e.g. sumDigits(1990) = 19)" },
    { name: "pythagorean(str)", description: "Pythagorean letter-to-number sum (A=1..Z=8, cycle 1-9)" },
    { name: "pythagoreanVowels(str)", description: "Sum of vowel values only — Soul Urge number" },
    { name: "pythagoreanConsonants(str)", description: "Sum of consonant values only — Personality number" },
    { name: "chaldean(str)", description: "Chaldean system letter sum" },
    { name: "lettersOnly(str)", description: "Remove all non-letter characters" },
    { name: "digitsOnly(str)", description: "Extract digits only, returns number" },
    { name: "weekdayValue(dayIndex)", description: "Numerology day-number for a JS weekday index (0=Sun..6=Sat): Sun=1, Mon=2, Tue=9, Wed=5, Thu=3, Fri=6, Sat=8" },
    { name: "randomInt(min, max)", description: "Cryptographically-secure, unbiased random integer between min and max (inclusive)" },
  ],
  examples: [
    { label: "Birthday Number", expression: "reduce(day)" },
    { label: "Destiny Number", expression: "reduce(sumDigits(day) + sumDigits(month) + sumDigits(year))" },
    { label: "Personality Number (Consonants)", expression: "reduce(pythagoreanConsonants(name))" },
    { label: "Soul Urge / Heart's Desire (Vowels)", expression: "reduce(pythagoreanVowels(name))" },
    { label: "Name Number (Pythagorean)", expression: "reduce(pythagorean(name))" },
    { label: "Name Number (Chaldean)", expression: "reduce(chaldean(name))" },
    { label: "Personal Year", expression: "reduceAll(sumDigits(day) + sumDigits(month) + sumDigits(cycleYear) + birthdayWeekday)" },
    { label: "Personal Month", expression: "reduceAll(sumDigits(day) + sumDigits(month) + sumDigits(year) + sumDigits(currentYear) + monthsSinceLastBirthday)" },
    { label: "Personal Day", expression: "reduceAll(sumDigits(day) + sumDigits(month) + sumDigits(year) + sumDigits(currentDay) + sumDigits(currentMonth) + sumDigits(cycleYear) + todayWeekday)" },
    { label: "Vehicle / Phone / House Number", expression: "reduce(sumDigits(extraInput))" },
    { label: "Random Number (0-108)", expression: "randomInt(0, 108)" },
  ],
};
