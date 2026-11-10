"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Note, Empty, SubHeading } from "@/components/tools/parts";

const MAX_LAPS = 200;

/** "01:23.45", or "1:01:23.45" once past an hour. */
function formatDuration(ms: number) {
  const safe = Math.max(0, Math.floor(ms));
  const centis = Math.floor(safe / 10) % 100;
  const seconds = Math.floor(safe / 1000) % 60;
  const minutes = Math.floor(safe / 60_000) % 60;
  const hours = Math.floor(safe / 3_600_000);
  const pad = (value: number) => `${value}`.padStart(2, "0");
  const base = `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
  return hours > 0 ? `${hours}:${base}` : base;
}

export default function Stopwatch() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);

  const runningRef = useRef(false);
  const startedAtRef = useRef(0);
  const baseRef = useRef(0);
  const elapsedRef = useRef(0);

  // The displayed value is derived from timestamps, so a backgrounded tab
  // resumes without losing time the way frame counting would.
  useEffect(() => {
    if (!running) return;
    startedAtRef.current = Date.now();
    const id = window.setInterval(() => {
      const value = baseRef.current + (Date.now() - startedAtRef.current);
      elapsedRef.current = value;
      setElapsed(value);
    }, 50);
    return () => window.clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    if (!runningRef.current) return;
    baseRef.current += Date.now() - startedAtRef.current;
    elapsedRef.current = baseRef.current;
    setElapsed(baseRef.current);
    runningRef.current = false;
    setRunning(false);
  }, []);

  const toggle = useCallback(() => {
    if (runningRef.current) stop();
    else start();
  }, [start, stop]);

  const reset = useCallback(() => {
    stop();
    baseRef.current = 0;
    elapsedRef.current = 0;
    setElapsed(0);
    setLaps([]);
  }, [stop]);

  const lap = useCallback(() => {
    if (!runningRef.current) return;
    const value = elapsedRef.current;
    setLaps((previous) => [value, ...previous].slice(0, MAX_LAPS));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if (event.code === "Space") {
        event.preventDefault();
        toggle();
      } else if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        lap();
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reset();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle, lap, reset]);

  // Splits need the chronological order, so reverse the newest-first list.
  const rows = useMemo(() => {
    const chrono = [...laps].reverse();
    let previous = 0;
    return chrono.map((total, index) => {
      const split = total - previous;
      previous = total;
      return { lap: index + 1, total, split };
    });
  }, [laps]);

  const splits = rows.map((row) => row.split);
  const best = splits.length > 0 ? Math.min(...splits) : 0;
  const worst = splits.length > 0 ? Math.max(...splits) : 0;
  const currentLap = elapsed - (laps[0] ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="panel flex flex-col items-center gap-5 p-6 sm:p-8">
        <p
          className="num text-5xl font-extrabold tracking-tight text-fg tabular-nums sm:text-6xl"
          role="timer"
          aria-live="off"
        >
          {formatDuration(elapsed)}
        </p>
        <p className="field-mono text-xs text-muted">
          Current lap · {formatDuration(currentLap)}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-primary min-w-28" onClick={toggle}>
            {running ? "Stop" : elapsed > 0 ? "Resume" : "Start"}
          </button>
          <button
            type="button"
            className="btn btn-secondary min-w-24"
            onClick={lap}
            disabled={!running}
          >
            Lap
          </button>
          <button
            type="button"
            className="btn btn-ghost min-w-24"
            onClick={reset}
            disabled={elapsed === 0 && laps.length === 0}
          >
            Reset
          </button>
        </div>
        <p className="text-xs text-muted">
          Keyboard: <kbd className="field-mono">Space</kbd> start or stop ·{" "}
          <kbd className="field-mono">L</kbd> lap · <kbd className="field-mono">R</kbd> reset
        </p>
      </div>

      <section aria-labelledby="stopwatch-laps">
        <SubHeading id="stopwatch-laps">
          {laps.length > 0 ? `Laps (${laps.length})` : "Laps"}
        </SubHeading>
        <div className="mt-3">
          {rows.length === 0 ? (
            <Empty>Record a lap while the timer runs and the splits will appear here.</Empty>
          ) : (
            <div className="scroll-region max-h-96 overflow-auto rounded-md border border-line">
              <table className="w-full text-sm">
                <caption className="sr-only">Each recorded lap with its split and comparison.</caption>
                <thead className="sticky top-0 bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-3.5 py-2.5 text-left font-medium">Lap</th>
                    <th scope="col" className="px-3.5 py-2.5 text-right font-medium">Split</th>
                    <th scope="col" className="px-3.5 py-2.5 text-right font-medium">Total</th>
                    <th scope="col" className="px-3.5 py-2.5 text-right font-medium">vs fastest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...rows].reverse().map((row) => {
                    const diff = row.split - best;
                    return (
                      <tr key={row.lap}>
                        <th scope="row" className="num px-3.5 py-2.5 text-left font-medium text-muted">
                          {row.lap}
                        </th>
                        <td
                          className={`num px-3.5 py-2.5 text-right font-semibold ${
                            row.split === best && splits.length > 1 ? "text-accent-text" : "text-fg"
                          }`}
                        >
                          {formatDuration(row.split)}
                        </td>
                        <td className="num px-3.5 py-2.5 text-right text-muted">
                          {formatDuration(row.total)}
                        </td>
                        <td className="num px-3.5 py-2.5 text-right text-muted">
                          {row.split === best ? "fastest" : `+${formatDuration(diff)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {rows.length > 0 ? (
          <p className="mt-2 text-xs text-muted">
            Fastest split {formatDuration(best)} · slowest {formatDuration(worst)} · the list keeps the
            most recent {MAX_LAPS} laps.
          </p>
        ) : null}
      </section>

      <Note>
        Time is measured from timestamps rather than by counting animation frames, so switching tabs
        or locking the screen cannot make it drift. It is shown to a hundredth of a second; the true
        resolution is limited by the browser&rsquo;s timer precision, which most browsers coarsen
        slightly for security.
      </Note>
    </div>
  );
}
