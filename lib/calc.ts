/**
 * Pure maths for the calculators. Nothing here touches the DOM, so it is safe to
 * call during render once the inputs are strings or numbers.
 */

/* ------------------------------------------------------------ percentages */

export function percentOf(percent: number, value: number): number {
  return (percent / 100) * value;
}

export function isWhatPercent(part: number, whole: number): number | null {
  if (whole === 0) return null;
  return (part / whole) * 100;
}

export interface PercentChange {
  change: number | null;
  direction: "increase" | "decrease" | "none" | "undefined";
  multiplier: number | null;
}

export function percentChange(from: number, to: number): PercentChange {
  if (from === 0) return { change: null, direction: "undefined", multiplier: null };
  const change = ((to - from) / Math.abs(from)) * 100;
  return {
    change,
    direction: change > 0 ? "increase" : change < 0 ? "decrease" : "none",
    multiplier: to / from,
  };
}

/* -------------------------------------------------------------- unit conv */

export type UnitCategory = "length" | "weight" | "volume" | "temperature";

export interface UnitDefinition {
  id: string;
  label: string;
  /** Multiplier to the category base unit. Missing for temperature. */
  factor?: number;
}

export const UNIT_GROUPS: Record<UnitCategory, { label: string; units: UnitDefinition[] }> = {
  length: {
    label: "Length",
    units: [
      { id: "mm", label: "Millimetre (mm)", factor: 0.001 },
      { id: "cm", label: "Centimetre (cm)", factor: 0.01 },
      { id: "m", label: "Metre (m)", factor: 1 },
      { id: "km", label: "Kilometre (km)", factor: 1000 },
      { id: "in", label: "Inch (in)", factor: 0.0254 },
      { id: "ft", label: "Foot (ft)", factor: 0.3048 },
      { id: "yd", label: "Yard (yd)", factor: 0.9144 },
      { id: "mi", label: "Mile (mi)", factor: 1609.344 },
    ],
  },
  weight: {
    label: "Weight",
    units: [
      { id: "mg", label: "Milligram (mg)", factor: 0.000001 },
      { id: "g", label: "Gram (g)", factor: 0.001 },
      { id: "kg", label: "Kilogram (kg)", factor: 1 },
      { id: "t", label: "Tonne (t)", factor: 1000 },
      { id: "oz", label: "Ounce (oz)", factor: 0.028349523125 },
      { id: "lb", label: "Pound (lb)", factor: 0.45359237 },
      { id: "st", label: "Stone (st)", factor: 6.35029318 },
    ],
  },
  volume: {
    label: "Volume",
    units: [
      { id: "ml", label: "Millilitre (ml)", factor: 0.001 },
      { id: "l", label: "Litre (L)", factor: 1 },
      { id: "m3", label: "Cubic metre (m³)", factor: 1000 },
      { id: "tsp", label: "Teaspoon, US (tsp)", factor: 0.00492892159375 },
      { id: "tbsp", label: "Tablespoon, US (tbsp)", factor: 0.01478676478125 },
      { id: "floz", label: "Fluid ounce, US (fl oz)", factor: 0.0295735295625 },
      { id: "cup", label: "Cup, US", factor: 0.2365882365 },
      { id: "pt", label: "Pint, US (pt)", factor: 0.473176473 },
      { id: "qt", label: "Quart, US (qt)", factor: 0.946352946 },
      { id: "gal", label: "Gallon, US (gal)", factor: 3.785411784 },
      { id: "galuk", label: "Gallon, imperial (gal)", factor: 4.54609 },
    ],
  },
  temperature: {
    label: "Temperature",
    units: [
      { id: "c", label: "Celsius (°C)" },
      { id: "f", label: "Fahrenheit (°F)" },
      { id: "k", label: "Kelvin (K)" },
    ],
  },
};

function convertTemperature(value: number, from: string, to: string): number {
  // Normalise to Celsius first, then out to the target.
  let celsius: number;
  if (from === "c") celsius = value;
  else if (from === "f") celsius = ((value - 32) * 5) / 9;
  else celsius = value - 273.15;

  if (to === "c") return celsius;
  if (to === "f") return (celsius * 9) / 5 + 32;
  return celsius + 273.15;
}

export function convertUnit(category: UnitCategory, from: string, to: string, value: number): number {
  if (!Number.isFinite(value)) return NaN;
  if (category === "temperature") return convertTemperature(value, from, to);

  const units = UNIT_GROUPS[category].units;
  const fromUnit = units.find((unit) => unit.id === from);
  const toUnit = units.find((unit) => unit.id === to);
  if (!fromUnit?.factor || !toUnit?.factor) return NaN;
  return (value * fromUnit.factor) / toUnit.factor;
}

/* --------------------------------------------------------------------- BMI */

export type BmiBand = "Underweight" | "Healthy range" | "Overweight" | "Obese";

export interface BmiResult {
  bmi: number;
  band: BmiBand;
  /** Healthy-weight range in kilograms for the given height in metres. */
  healthyMinKg: number;
  healthyMaxKg: number;
}

export function bmiFromMetric(heightCm: number, weightKg: number): BmiResult | null {
  const metres = heightCm / 100;
  if (metres <= 0 || weightKg <= 0) return null;
  const bmi = weightKg / (metres * metres);
  return { bmi, band: bandFor(bmi), healthyMinKg: 18.5 * metres * metres, healthyMaxKg: 24.9 * metres * metres };
}

export function bmiFromImperial(heightInches: number, weightLb: number): BmiResult | null {
  if (heightInches <= 0 || weightLb <= 0) return null;
  const bmi = (703 * weightLb) / (heightInches * heightInches);
  const metres = heightInches * 0.0254;
  return { bmi, band: bandFor(bmi), healthyMinKg: 18.5 * metres * metres, healthyMaxKg: 24.9 * metres * metres };
}

function bandFor(bmi: number): BmiBand {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy range";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/* -------------------------------------------------------------------- loan */

export interface AmortRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  months: number;
  schedule: AmortRow[];
}

function amortize(principal: number, monthlyRate: number, payment: number, maxMonths: number): LoanResult {
  const schedule: AmortRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPaid = 0;
  let period = 0;

  while (balance > 0.005 && period < maxMonths) {
    period += 1;
    const interest = balance * monthlyRate;
    let principalPart = payment - interest;
    if (principalPart <= 0) {
      // Payment does not even cover interest — the loan never amortises.
      return { monthlyPayment: payment, totalPaid: Infinity, totalInterest: Infinity, months: Infinity, schedule: [] };
    }
    if (principalPart > balance) principalPart = balance;

    totalPaid += interest + principalPart;
    totalInterest += interest;
    balance -= principalPart;
    schedule.push({ period, payment: interest + principalPart, interest, principal: principalPart, balance });
  }

  return { monthlyPayment: payment, totalPaid, totalInterest, months: period, schedule };
}

export interface LoanInput {
  principal: number;
  annualRatePct: number;
  months: number;
  extraPayment: number;
}

export interface LoanComparison {
  base: LoanResult;
  withExtra: LoanResult | null;
  interestSaved: number;
  monthsSaved: number;
}

export function computeLoan({ principal, annualRatePct, months, extraPayment }: LoanInput): LoanComparison | null {
  if (principal <= 0 || months <= 0 || annualRatePct < 0) return null;

  const monthlyRate = annualRatePct / 100 / 12;
  const basePayment =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -months);

  const base = amortize(principal, monthlyRate, basePayment, months + 1);
  if (!Number.isFinite(base.totalPaid)) return { base, withExtra: null, interestSaved: 0, monthsSaved: 0 };

  if (extraPayment <= 0) return { base, withExtra: null, interestSaved: 0, monthsSaved: 0 };

  const withExtra = amortize(principal, monthlyRate, basePayment + extraPayment, months + 1);
  return {
    base,
    withExtra,
    interestSaved: base.totalInterest - withExtra.totalInterest,
    monthsSaved: base.months - withExtra.months,
  };
}

/* -------------------------------------------------------------------- dates */

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

export function toIsoDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export interface CalendarSpan {
  years: number;
  months: number;
  days: number;
}

/** Whole years, months and days between two ordered dates. */
function calendarSpan(from: Date, to: Date): CalendarSpan {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months -= 1;
    days += daysInMonth(to.getFullYear(), to.getMonth() - 1);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** 29 February birthdays fall on 1 March in a non-leap year, the usual convention. */
function birthdayInYear(year: number, birth: Date): Date {
  if (birth.getMonth() === 1 && birth.getDate() === 29 && !isLeapYear(year)) {
    return new Date(year, 2, 1);
  }
  return new Date(year, birth.getMonth(), birth.getDate());
}

export interface AgeResult extends CalendarSpan {
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  totalMinutes: number;
  nextBirthdayDays: number;
  nextBirthdayDate: Date;
}

export function computeAge(birth: Date, asOf: Date): AgeResult | null {
  if (asOf < birth) return null;
  const span = calendarSpan(birth, asOf);
  const ms = asOf.getTime() - birth.getTime();
  const totalDays = Math.round(ms / 86_400_000);

  let year = asOf.getFullYear();
  let next = birthdayInYear(year, birth);
  if (next.getTime() < asOf.getTime()) {
    year += 1;
    next = birthdayInYear(year, birth);
  }
  const nextBirthdayDays = Math.round((next.getTime() - asOf.getTime()) / 86_400_000);

  return {
    ...span,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalHours: totalDays * 24,
    totalMinutes: totalDays * 24 * 60,
    nextBirthdayDays,
    nextBirthdayDate: next,
  };
}

export interface DateDifference extends CalendarSpan {
  /** Signed day count; positive when the end is after the start. */
  totalDays: number;
  totalWeeks: number;
  businessDays: number;
  direction: -1 | 0 | 1;
}

export function dateDifference(start: Date, end: Date, { inclusiveEnd = false } = {}): DateDifference {
  const from = start <= end ? start : end;
  const to = start <= end ? end : start;
  const span = calendarSpan(from, to);
  const rawDays = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  const totalDays = inclusiveEnd ? rawDays + 1 : rawDays;

  // Count weekdays. A single long range is cheap enough to walk day by day.
  let businessDays = 0;
  const cursor = new Date(from.getTime());
  const limit = new Date(to.getTime());
  if (inclusiveEnd) limit.setDate(limit.getDate() + 1);
  const guard = 400_000;
  let steps = 0;
  while (cursor.getTime() < limit.getTime() && steps < guard) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) businessDays += 1;
    cursor.setDate(cursor.getDate() + 1);
    steps += 1;
  }

  const direction: -1 | 0 | 1 = start.getTime() === end.getTime() ? 0 : start < end ? 1 : -1;
  return { ...span, totalDays, totalWeeks: Math.floor(totalDays / 7), businessDays, direction };
}
