"use client";

import { useEffect, useMemo, useState } from "react";

import { TextInput } from "@/components/tools/interactive";
import { Note, Stat, StatGrid } from "@/components/tools/parts";
import { computeAge, parseIsoDate, toIsoDateValue } from "@/lib/calc";
import { formatNumber } from "@/lib/utils";

const longDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

export default function AgeCalculator() {
  const [birth, setBirth] = useState("");
  const [asOf, setAsOf] = useState("");

  // "Today" is resolved after mount so the prerendered HTML stays deterministic.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding editable state with the current date; the value must not exist at prerender time and has no render-time equivalent
    setAsOf(toIsoDateValue(new Date()));
  }, []);

  const age = useMemo(() => {
    const from = parseIsoDate(birth);
    const to = parseIsoDate(asOf);
    if (!from || !to) return null;
    return computeAge(from, to);
  }, [birth, asOf]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput
          label="Date of birth"
          type="date"
          value={birth}
          onChange={setBirth}
          hint="Stored nowhere. The calculation happens in this tab."
        />
        <TextInput label="Age at date" type="date" value={asOf} onChange={setAsOf} />
      </div>

      {age ? (
        <>
          <div className="panel p-5 sm:p-6">
            <p className="text-sm text-muted">Exact age</p>
            <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
              {age.years} {age.years === 1 ? "year" : "years"}, {age.months}{" "}
              {age.months === 1 ? "month" : "months"}, {age.days}{" "}
              {age.days === 1 ? "day" : "days"}
            </p>
            <p className="field-mono mt-3 text-xs text-muted">
              {formatNumber(age.totalDays)} days old
            </p>
          </div>

          <StatGrid>
            <Stat label="Total days" value={formatNumber(age.totalDays)} />
            <Stat label="Total weeks" value={formatNumber(age.totalWeeks)} hint={`${age.totalDays % 7} extra ${age.totalDays % 7 === 1 ? "day" : "days"}`} />
            <Stat label="Total hours" value={formatNumber(age.totalHours)} />
            <Stat label="Total minutes" value={formatNumber(age.totalMinutes)} />
          </StatGrid>

          <StatGrid className="lg:grid-cols-2">
            <Stat
              label="Next birthday"
              value={longDate.format(age.nextBirthdayDate)}
              hint={
                age.nextBirthdayDays === 0
                  ? "That is today."
                  : `${formatNumber(age.nextBirthdayDays)} ${age.nextBirthdayDays === 1 ? "day" : "days"} away`
              }
            />
            <Stat
              label="Turning"
              value={`${age.years + 1} years`}
              hint="Age on the next birthday"
            />
          </StatGrid>
        </>
      ) : (
        <p className="rounded-md border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          Enter a date of birth to see the exact age.
        </p>
      )}

      <Note>
        Months are counted on the calendar, so the result matches how a person would count their own
        age. A 29 February birthday is treated as 1 March in non-leap years, which is the convention
        most legal systems use. If the age-at date is before the birth date, there is nothing to
        calculate.
      </Note>
    </div>
  );
}
