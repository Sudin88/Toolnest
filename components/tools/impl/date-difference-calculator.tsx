"use client";

import { useEffect, useMemo, useState } from "react";

import { Check, TextInput } from "@/components/tools/interactive";
import { Note, Stat, StatGrid } from "@/components/tools/parts";
import { dateDifference, parseIsoDate, toIsoDateValue } from "@/lib/calc";
import { formatNumber } from "@/lib/utils";

const longDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

function addDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export default function DateDifferenceCalculator() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [inclusiveEnd, setInclusiveEnd] = useState(false);

  // Today is resolved after mount so the prerendered HTML stays deterministic.
  useEffect(() => {
    const today = new Date();
    setStart(toIsoDateValue(today));
    setEnd(toIsoDateValue(addDays(today, 30)));
  }, []);

  const result = useMemo(() => {
    const from = parseIsoDate(start);
    const to = parseIsoDate(end);
    if (!from || !to) return null;
    return { from, to, diff: dateDifference(from, to, { inclusiveEnd }) };
  }, [start, end, inclusiveEnd]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput label="Start date" type="date" value={start} onChange={setStart} />
        <TextInput label="End date" type="date" value={end} onChange={setEnd} />
      </div>

      <Check
        label="Include the end date in the count"
        checked={inclusiveEnd}
        onChange={setInclusiveEnd}
        hint="Useful for booking windows and events, where the final day counts as one of the days."
      />

      {result ? (
        <>
          <div className="panel p-5 sm:p-6">
            <p className="text-sm text-muted">
              {result.diff.direction === 0
                ? "The dates are the same"
                : `${longDate.format(result.diff.direction > 0 ? result.from : result.to)} to ${longDate.format(result.diff.direction > 0 ? result.to : result.from)}`}
            </p>
            <p className="num mt-1 text-4xl font-extrabold tracking-tight text-fg">
              {formatNumber(result.diff.totalDays)} {result.diff.totalDays === 1 ? "day" : "days"}
            </p>
            <p className="mt-2 text-sm text-muted">
              That is {result.diff.years} {result.diff.years === 1 ? "year" : "years"},{" "}
              {result.diff.months} {result.diff.months === 1 ? "month" : "months"} and{" "}
              {result.diff.days} {result.diff.days === 1 ? "day" : "days"}.
            </p>
          </div>

          <StatGrid>
            <Stat label="Weeks" value={formatNumber(result.diff.totalWeeks)} hint={`${result.diff.totalDays % 7} extra ${result.diff.totalDays % 7 === 1 ? "day" : "days"}`} />
            <Stat label="Business days" value={formatNumber(result.diff.businessDays)} hint="Saturdays and Sundays excluded" />
            <Stat label="Calendar breakdown" value={`${result.diff.years}y ${result.diff.months}m ${result.diff.days}d`} hint="Years, months and days counted on the calendar" />
            <Stat
              label="Direction"
              value={result.diff.direction === 0 ? "Same day" : result.diff.direction > 0 ? "Forward" : "Backward"}
              hint={result.diff.direction === 0 ? undefined : "Reported from the earlier date to the later one."}
            />
          </StatGrid>
        </>
      ) : (
        <p className="rounded-md border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          Pick two valid dates to see the difference.
        </p>
      )}

      <Note>
        The count is exclusive of the end date by default, so 1 March to 2 March is one day. Turn on
        the switch above to include it. Only weekends are excluded from the business-day figure —
        public holidays vary by country and year, so subtract them yourself.
      </Note>
    </div>
  );
}
