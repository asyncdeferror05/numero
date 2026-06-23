/**
 * Formula Engine — dynamic expression evaluator for numerology calculations.
 *
 * Formulas are stored as text expressions in the database.
 * The engine evaluates them with a sandboxed context of helper functions
 * and input variables.
 *
 * Available context variables:
 *   day, month, year          — DOB parts
 *   currentYear, currentMonth, currentDay — today
 *   name                      — full name string
 *   extraInput                — vehicle/phone/house number string
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

const SAFE_FN_NAMES = [
  "reduce", "reduceAll", "sumDigits", "pythagorean",
  "pythagoreanVowels", "pythagoreanConsonants", "chaldean",
  "lettersOnly", "digitsOnly",
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
 */
export function buildContext(
  dob: Date,
  name = "",
  extraInput = "",
  today = new Date(),
  extra: Record<string, unknown> = {},
): FormulaContext {
  return {
    day: dob.getDate(),
    month: dob.getMonth() + 1,
    year: dob.getFullYear(),
    name,
    currentYear: today.getFullYear(),
    currentMonth: today.getMonth() + 1,
    currentDay: today.getDate(),
    extraInput,
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
    { name: "currentYear", description: "Current year" },
    { name: "currentMonth", description: "Current month (1–12)" },
    { name: "currentDay", description: "Current day (1–31)" },
    { name: "extraInput", description: "Extra input — vehicle/phone/house number" },
  ],
  functions: [
    { name: "reduce(n)", description: "Reduce number to single digit, preserving master numbers 11, 22, 33" },
    { name: "reduceAll(n)", description: "Force reduce to single digit, ignoring master numbers" },
    { name: "sumDigits(n)", description: "Sum all digits of a number (e.g. sumDigits(1990) = 19)" },
    { name: "pythagorean(str)", description: "Pythagorean letter-to-number sum (A=1..Z=8, cycle 1-9)" },
    { name: "pythagoreanVowels(str)", description: "Sum of vowel values only — Soul Urge number" },
    { name: "pythagoreanConsonants(str)", description: "Sum of consonant values only — Personality number" },
    { name: "chaldean(str)", description: "Chaldean system letter sum" },
    { name: "lettersOnly(str)", description: "Remove all non-letter characters" },
    { name: "digitsOnly(str)", description: "Extract digits only, returns number" },
  ],
  examples: [
    { label: "Birthday Number", expression: "reduce(day)" },
    { label: "Destiny Number", expression: "reduce(sumDigits(day) + sumDigits(month) + sumDigits(year))" },
    { label: "Personality Number (Consonants)", expression: "reduce(pythagoreanConsonants(name))" },
    { label: "Soul Urge / Heart's Desire (Vowels)", expression: "reduce(pythagoreanVowels(name))" },
    { label: "Name Number (Pythagorean)", expression: "reduce(pythagorean(name))" },
    { label: "Name Number (Chaldean)", expression: "reduce(chaldean(name))" },
    { label: "Personal Year", expression: "reduce(sumDigits(day) + sumDigits(month) + sumDigits(currentYear))" },
    { label: "Personal Month", expression: "reduce(reduce(sumDigits(day) + sumDigits(month) + sumDigits(currentYear)) + currentMonth)" },
    { label: "Personal Day", expression: "reduce(reduce(reduce(sumDigits(day) + sumDigits(month) + sumDigits(currentYear)) + currentMonth) + currentDay)" },
    { label: "Vehicle / Phone / House Number", expression: "reduce(sumDigits(extraInput))" },
  ],
};
