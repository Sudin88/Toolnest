"use client";

import { useState } from "react";

import { NumberInput, Segmented } from "@/components/tools/interactive";
import { Note, Stat, StatGrid } from "@/components/tools/parts";
import { bmiFromImperial, bmiFromMetric, type BmiBand } from "@/lib/calc";

type Units = "metric" | "imperial";

const LB_PER_KG = 2.2046226218;
const fmt = (value: number, digits = 1) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);

const BAND_TONE: Record<BmiBand, string> = {
  Underweight: "text-highlight-text",
  "Healthy range": "text-accent-text",
  Overweight: "text-highlight-text",
  Obese: "text-highlight-text",
};

/**
 * A reference band, 15 to 40, with the visitor's position marked. Colour is a
 * secondary cue only — the band name and number carry the meaning.
 */
function BandBar({ bmi }: { bmi: number }) {
  const clamped = Math.min(Math.max(bmi, 15), 40);
  const left = ((clamped - 15) / 25) * 100;

  return (
    <div className="mt-4">
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
        <span className="absolute inset-y-0 left-0 w-[14%] bg-highlight/35" aria-hidden="true" />
        <span className="absolute inset-y-0 left-[14%] w-[26%] bg-accent/45" aria-hidden="true" />
        <span className="absolute inset-y-0 left-[40%] w-[20%] bg-highlight/35" aria-hidden="true" />
        <span className="absolute inset-y-0 left-[60%] w-[40%] bg-highlight/55" aria-hidden="true" />
      </div>
      <div className="relative mt-1 h-4">
        <span
          className="absolute -translate-x-1/2 text-xs font-semibold text-fg"
          style={{ left: `${left}%` }}
          aria-hidden="true"
        >
          ▲
        </span>
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>Under 18.5</span>
        <span>18.5 – 24.9</span>
        <span>25 – 29.9</span>
        <span>30+</span>
      </div>
    </div>
  );
}

export default function BmiCalculator() {
  const [units, setUnits] = useState<Units>("metric");
  const [heightCm, setHeightCm] = useState<number | "">(175);
  const [weightKg, setWeightKg] = useState<number | "">(72);
  const [feet, setFeet] = useState<number | "">(5);
  const [inches, setInches] = useState<number | "">(9);
  const [pounds, setPounds] = useState<number | "">(159);

  const result =
    units === "metric"
      ? heightCm === "" || weightKg === ""
        ? null
        : bmiFromMetric(heightCm, weightKg)
      : feet === "" || inches === "" || pounds === ""
        ? null
        : bmiFromImperial(Number(feet) * 12 + Number(inches), pounds);

  const healthy =
    result === null
      ? null
      : units === "metric"
        ? { min: result.healthyMinKg, max: result.healthyMaxKg, unit: "kg" }
        : {
            min: result.healthyMinKg * LB_PER_KG,
            max: result.healthyMaxKg * LB_PER_KG,
            unit: "lb",
          };

  return (
    <div className="flex flex-col gap-6">
      <Segmented<Units>
        label="Units"
        value={units}
        onChange={setUnits}
        options={[
          { value: "metric", label: "Metric (cm, kg)" },
          { value: "imperial", label: "Imperial (ft, lb)" },
        ]}
      />

      {units === "metric" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberInput
            label="Height (cm)"
            value={heightCm}
            onChange={setHeightCm}
            min={50}
            max={260}
            step={0.5}
          />
          <NumberInput
            label="Weight (kg)"
            value={weightKg}
            onChange={setWeightKg}
            min={10}
            max={400}
            step={0.1}
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-3">
          <NumberInput label="Height (ft)" value={feet} onChange={setFeet} min={1} max={8} />
          <NumberInput label="Height (in)" value={inches} onChange={setInches} min={0} max={11} step={0.5} />
          <NumberInput label="Weight (lb)" value={pounds} onChange={setPounds} min={20} max={900} step={0.5} />
        </div>
      )}

      <div className="panel p-5 sm:p-6">
        {result === null ? (
          <p className="text-sm text-muted">
            Enter a height and weight to see the body mass index.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">Your BMI</p>
            <p className="num mt-1 text-4xl font-extrabold tracking-tight text-fg">
              {fmt(result.bmi)}
            </p>
            <p className={`mt-2 font-display text-lg font-bold ${BAND_TONE[result.band]}`}>
              {result.band}
            </p>
            <BandBar bmi={result.bmi} />
          </>
        )}
      </div>

      {healthy ? (
        <StatGrid className="lg:grid-cols-2">
          <Stat
            label="Healthy range for your height"
            value={`${fmt(healthy.min)} – ${fmt(healthy.max)} ${healthy.unit}`}
            hint="The 18.5 to 24.9 band applied to this height."
          />
          <Stat
            label="BMI is calculated from"
            value={units === "metric" ? "kg ÷ m²" : "703 × lb ÷ in²"}
            hint="Weight divided by height squared, with a unit factor for imperial."
          />
        </StatGrid>
      ) : null}

      <Note tone="warn">
        BMI is one screening number, not a diagnosis. It cannot distinguish muscle from fat, and the
        standard bands were derived from population data that did not represent everyone equally —
        risk rises at a lower BMI for some groups. Treat this as a rough reference and talk to a
        clinician about your own health. Children and teenagers need age-specific percentile charts
        instead, so this calculator is for adults.
      </Note>
    </div>
  );
}
