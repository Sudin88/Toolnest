"use client";

import { useMemo } from "react";

import { NumberInput, Select } from "@/components/tools/interactive";
import { Note } from "@/components/tools/parts";
import { UNIT_GROUPS, convertUnit, type UnitCategory } from "@/lib/calc";
import { draftNumber, draftOneOf, draftString, useToolDraft } from "@/lib/tool-draft";

const fmt = (value: number) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", { maximumSignificantDigits: 6, maximumFractionDigits: 6 }).format(value)
    : "-";

const CATEGORY_ORDER: UnitCategory[] = ["length", "weight", "volume", "temperature"];

/** Built once: `useToolDraft` compares decoder identity, so it must be stable. */
const decodeCategory = draftOneOf(CATEGORY_ORDER);

export default function UnitConverter() {
  // Each stored value is checked against its field's shape on read, so a stale
  // or hand-edited draft falls back to the default instead of reaching
  // `UNIT_GROUPS[category]` as an unknown key (a render crash).
  const [category, setCategory] = useToolDraft<UnitCategory>("unit-converter", "category", "length", {
    decode: decodeCategory,
  });
  const [from, setFrom] = useToolDraft<string>("unit-converter", "from", "cm", { decode: draftString });
  const [to, setTo] = useToolDraft<string>("unit-converter", "to", "in", { decode: draftString });
  const [value, setValue] = useToolDraft<number | "">("unit-converter", "value", 100, { decode: draftNumber });

  const units = UNIT_GROUPS[category].units;

  function changeCategory(next: UnitCategory) {
    setCategory(next);
    const list = UNIT_GROUPS[next].units;
    setFrom(list[0].id);
    setTo(list[1]?.id ?? list[0].id);
  }

  const numeric = typeof value === "number" ? value : null;
  const result = numeric === null ? null : convertUnit(category, from, to, numeric);

  // Short symbol for the result line: the trailing "(...)" from the label, else the id.
  const symbol = (id: string) => {
    const match = units.find((unit) => unit.id === id)?.label.match(/\(([^)]+)\)\s*$/);
    return match ? match[1] : id;
  };

  const table = useMemo(() => {
    if (numeric === null) return [];
    return units.map((unit) => ({
      ...unit,
      value: convertUnit(category, from, unit.id, numeric),
    }));
  }, [category, from, numeric, units]);

  return (
    <div className="flex flex-col gap-6">
      <Select
        label="Category"
        value={category}
        onChange={(next) => changeCategory(next as UnitCategory)}
        options={CATEGORY_ORDER.map((id) => ({ value: id, label: UNIT_GROUPS[id].label }))}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <NumberInput label="Value" value={value} onChange={setValue} />
        <Select
          label="From"
          value={from}
          onChange={setFrom}
          options={units.map((unit) => ({ value: unit.id, label: unit.label }))}
        />
        <Select
          label="To"
          value={to}
          onChange={setTo}
          options={units.map((unit) => ({ value: unit.id, label: unit.label }))}
        />
      </div>

      <div className="panel p-5 sm:p-6">
        {result === null ? (
          <p className="text-sm text-muted">
            Enter a value to convert it.
          </p>
        ) : (
          <>
            <p className="field-mono text-sm text-muted">
              {fmt(numeric ?? 0)} {symbol(from)} =
            </p>
            <p className="num mt-1 break-all text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
              {fmt(result)} {symbol(to)}
            </p>
          </>
        )}
      </div>

      <section aria-labelledby="unit-reference">
        <h3 id="unit-reference" className="mb-3 font-display text-[0.9375rem] font-bold text-fg">
          All {UNIT_GROUPS[category].label.toLowerCase()} units
        </h3>
        {table.length === 0 ? (
          <p className="rounded-md border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
            The same value in every unit will appear here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-line">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {table.map((row) => (
                  <tr key={row.id} className={row.id === to ? "bg-surface-2" : "bg-surface"}>
                    <th scope="row" className="px-3.5 py-2.5 text-left font-medium text-muted">
                      {row.label}
                    </th>
                    <td className="num px-3.5 py-2.5 text-right font-semibold text-fg">
                      {fmt(row.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Note>
        Length, weight and volume scale by multiplying, so zero stays zero. Temperature has an
        offset, which is why Celsius to Fahrenheit needs a multiplication and an addition. US and
        imperial gallons are listed separately: they differ by about 20%.
      </Note>
    </div>
  );
}
