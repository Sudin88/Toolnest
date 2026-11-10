"use client";

import { NumberInput, Select } from "@/components/tools/interactive";
import { Note, Stat, StatGrid } from "@/components/tools/parts";
import { CURRENCIES, formatMoney } from "@/lib/currency";
import { useToolDraft } from "@/lib/tool-draft";

const QUICK_TIPS = [10, 12, 15, 18, 20, 25];

const ROUNDING = [
  { value: "none", label: "No rounding" },
  { value: "0.05", label: "Up to the nearest 0.05" },
  { value: "0.1", label: "Up to the nearest 0.10" },
  { value: "0.5", label: "Up to the nearest 0.50" },
  { value: "1", label: "Up to the nearest whole unit" },
];

export default function TipCalculator() {
  const [currency, setCurrency] = useToolDraft<string>("tip-calculator", "currency", "USD");
  const [bill, setBill] = useToolDraft<number | "">("tip-calculator", "bill", 60);
  const [percent, setPercent] = useToolDraft<number | "">("tip-calculator", "percent", 18);
  const [people, setPeople] = useToolDraft<number | "">("tip-calculator", "people", 2);
  const [rounding, setRounding] = useToolDraft<string>("tip-calculator", "rounding", "none");

  const billValue = bill === "" ? 0 : Number(bill);
  const pct = percent === "" ? 0 : Number(percent);
  const headcount = Math.max(1, people === "" ? 1 : Math.floor(Number(people)));

  const tip = (billValue * pct) / 100;
  const total = billValue + tip;
  const perPerson = total / headcount;

  const step = rounding === "none" ? 0 : Number(rounding);
  const roundedTotal = step > 0 ? Math.ceil(total / step) * step : null;
  const roundedPerPerson = roundedTotal === null ? null : roundedTotal / headcount;
  const money = (value: number) => formatMoney(value, currency);

  const reference = QUICK_TIPS.map((p) => ({
    percent: p,
    tip: (billValue * p) / 100,
    total: billValue + (billValue * p) / 100,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <NumberInput label="Bill, before tip" value={bill} onChange={setBill} min={0} step={1} />
        <Select label="Currency" value={currency} onChange={setCurrency} options={[...CURRENCIES]} />
      </div>

      <div>
        <label className="label" htmlFor="tip-percent">
          Tip percentage
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="tip-percent"
            type="number"
            inputMode="decimal"
            className="field num max-w-[7rem]"
            value={percent}
            min={0}
            step={1}
            onChange={(event) => setPercent(event.target.value === "" ? "" : Number(event.target.value))}
          />
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TIPS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPercent(value)}
                aria-pressed={percent === value}
                className={`btn btn-sm ${percent === value ? "btn-primary" : "btn-secondary"} num`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <NumberInput
          label="Split between"
          value={people}
          onChange={setPeople}
          min={1}
          max={100}
          hint="People sharing the bill."
        />
        <Select label="Round the total" value={rounding} onChange={setRounding} options={ROUNDING} />
      </div>

      <StatGrid>
        <Stat label="Tip" value={money(tip)} hint={`${pct}% of ${money(billValue)}`} />
        <Stat label="Total to pay" value={money(total)} hint="Bill plus tip" />
        <Stat
          label={`Per person (${headcount})`}
          value={money(perPerson)}
          hint={headcount > 1 ? "The bill split evenly" : "One person, so this is the total"}
        />
        <Stat
          label="Rounded up"
          value={roundedTotal === null ? "—" : money(roundedTotal)}
          hint={
            roundedTotal === null
              ? "Choose a rounding rule to see this"
              : `${money(roundedPerPerson ?? 0)} each, ${money(roundedTotal - total)} extra`
          }
        />
      </StatGrid>

      <section aria-labelledby="tip-reference">
        <h3 id="tip-reference" className="mb-3 font-display text-[0.9375rem] font-bold text-fg">
          Common tip percentages on this bill
        </h3>
        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-3.5 py-2.5 text-left font-medium">Tip</th>
                <th scope="col" className="px-3.5 py-2.5 text-right font-medium">Amount</th>
                <th scope="col" className="px-3.5 py-2.5 text-right font-medium">Total</th>
                <th scope="col" className="px-3.5 py-2.5 text-right font-medium">Each ({headcount})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {reference.map((row) => (
                <tr key={row.percent} className={row.percent === pct ? "bg-surface-2" : undefined}>
                  <th scope="row" className="num px-3.5 py-2.5 text-left font-medium text-muted">
                    {row.percent}%
                  </th>
                  <td className="num px-3.5 py-2.5 text-right text-fg">{money(row.tip)}</td>
                  <td className="num px-3.5 py-2.5 text-right text-fg">{money(row.total)}</td>
                  <td className="num px-3.5 py-2.5 text-right text-muted">
                    {money(row.total / headcount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Note>
        The traditional percentage refers to the pre-tax amount, so enter the bill before tax. Every
        figure here is a guide — the split is even, and tipping conventions vary by country, so
        checking local etiquette is worth more than any calculator.
      </Note>
    </div>
  );
}
