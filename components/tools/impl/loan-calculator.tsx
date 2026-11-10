"use client";

import { useMemo, useState } from "react";

import { Check, NumberInput, Select } from "@/components/tools/interactive";
import { Note, Stat, StatGrid } from "@/components/tools/parts";
import { computeLoan } from "@/lib/calc";
import { CURRENCIES, formatMoney as money } from "@/lib/currency";

export default function LoanCalculator() {
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState<number | "">(250000);
  const [rate, setRate] = useState<number | "">(6.5);
  const [term, setTerm] = useState<number | "">(30);
  const [termUnit, setTermUnit] = useState("years");
  const [extra, setExtra] = useState<number | "">(0);
  const [showAll, setShowAll] = useState(false);

  const months =
    term === "" ? 0 : Math.round(termUnit === "years" ? Number(term) * 12 : Number(term));

  const comparison = useMemo(() => {
    if (amount === "" || rate === "" || months <= 0) return null;
    return computeLoan({
      principal: Number(amount),
      annualRatePct: Number(rate),
      months,
      extraPayment: extra === "" ? 0 : Number(extra),
    });
  }, [amount, rate, months, extra]);

  const base = comparison?.base ?? null;
  const withExtra = comparison?.withExtra ?? null;
  const neverRepays = base !== null && !Number.isFinite(base.totalPaid);
  const rows = base?.schedule ?? [];
  const visible = showAll ? rows : rows.slice(0, 12);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <NumberInput
          label="Amount borrowed"
          value={amount}
          onChange={setAmount}
          min={0}
          step={100}
        />
        <NumberInput
          label="Annual interest rate (%)"
          value={rate}
          onChange={setRate}
          min={0}
          step={0.05}
        />
        <NumberInput label="Term" value={term} onChange={setTerm} min={1} max={600} />
        <Select
          label="Term unit"
          value={termUnit}
          onChange={setTermUnit}
          options={[
            { value: "years", label: "Years" },
            { value: "months", label: "Months" },
          ]}
        />
        <NumberInput
          label="Extra payment each month"
          value={extra}
          onChange={setExtra}
          min={0}
          step={10}
          hint="Optional. Set to 0 to ignore."
        />
        <Select
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={[...CURRENCIES]}
          hint="Formatting only — the maths is currency-agnostic."
        />
      </div>

      {neverRepays ? (
        <Note tone="warn">
          At this interest rate the payment does not cover the interest charged each month, so the
          balance would never fall. Increase the term or the rate assumptions are the problem — check
          the numbers.
        </Note>
      ) : null}

      {base ? (
        <StatGrid>
          <Stat
            label="Monthly payment"
            value={money(base.monthlyPayment, currency)}
            hint={`Across ${base.months} ${base.months === 1 ? "month" : "months"}`}
          />
          <Stat
            label="Total repaid"
            value={money(base.totalPaid, currency)}
            hint="Principal plus interest"
          />
          <Stat
            label="Total interest"
            value={money(base.totalInterest, currency)}
            hint={
              Number.isFinite(base.totalPaid) && base.totalPaid > 0
                ? `${Math.round((base.totalInterest / (base.totalPaid - base.totalInterest)) * 100)}% of the amount borrowed`
                : undefined
            }
          />
          <Stat
            label="Amount borrowed"
            value={money(Number(amount) || 0, currency)}
            hint={`Over ${(months / 12).toFixed(1)} years`}
          />
        </StatGrid>
      ) : (
        <p className="rounded-md border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          Enter an amount, a rate and a term to see the repayment.
        </p>
      )}

      {withExtra ? (
        <section aria-labelledby="loan-extra" className="panel p-5 sm:p-6">
          <h3 id="loan-extra" className="font-display text-[0.9375rem] font-bold text-fg">
            With the extra payment
          </h3>
          <StatGrid className="mt-4 lg:grid-cols-4">
            <Stat label="Monthly payment" value={money(withExtra.monthlyPayment, currency)} />
            <Stat
              label="Paid off in"
              value={`${withExtra.months} months`}
              hint={
                comparison && comparison.monthsSaved > 0
                  ? `${comparison.monthsSaved} sooner`
                  : undefined
              }
            />
            <Stat label="Total interest" value={money(withExtra.totalInterest, currency)} />
            <Stat
              label="Interest saved"
              value={money(comparison?.interestSaved ?? 0, currency)}
              hint="Compared with the base schedule"
            />
          </StatGrid>
        </section>
      ) : null}

      {base && rows.length > 0 ? (
        <section aria-labelledby="loan-schedule">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 id="loan-schedule" className="font-display text-[0.9375rem] font-bold text-fg">
              Amortisation schedule
            </h3>
            <Check
              label={`Show all ${rows.length} payments`}
              checked={showAll}
              onChange={setShowAll}
            />
          </div>
          <div className="scroll-region max-h-96 overflow-auto rounded-md border border-line">
            <table className="w-full min-w-[34rem] text-sm">
              <caption className="sr-only">
                Each payment split between interest and principal, with the remaining balance.
              </caption>
              <thead className="sticky top-0 bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5 text-left font-medium">#</th>
                  <th scope="col" className="px-3.5 py-2.5 text-right font-medium">Payment</th>
                  <th scope="col" className="px-3.5 py-2.5 text-right font-medium">Interest</th>
                  <th scope="col" className="px-3.5 py-2.5 text-right font-medium">Principal</th>
                  <th scope="col" className="px-3.5 py-2.5 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((row) => (
                  <tr key={row.period}>
                    <th scope="row" className="num px-3.5 py-2 text-left font-medium text-muted">
                      {row.period}
                    </th>
                    <td className="num px-3.5 py-2 text-right text-fg">{money(row.payment, currency)}</td>
                    <td className="num px-3.5 py-2 text-right text-muted">{money(row.interest, currency)}</td>
                    <td className="num px-3.5 py-2 text-right text-muted">{money(row.principal, currency)}</td>
                    <td className="num px-3.5 py-2 text-right text-fg">{money(row.balance, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!showAll && rows.length > 12 ? (
            <p className="mt-2 text-xs text-muted">
              Showing the first 12 of {rows.length} payments.
            </p>
          ) : null}
        </section>
      ) : null}

      <Note>
        The monthly payment comes from the standard amortisation formula: principal × periodic rate
        ÷ (1 − (1 + periodic rate)⁻ⁿ). Interest is charged on the outstanding balance, which is why
        the early payments are almost entirely interest. The result covers principal and interest
        only — arrangement fees, insurance and tax are additional.
      </Note>
    </div>
  );
}
