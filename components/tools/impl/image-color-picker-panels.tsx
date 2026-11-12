import { CopyButton } from "@/components/tools/interactive";
import { SubHeading } from "@/components/tools/parts";

/**
 * The two side panels of the image colour picker. They are presentational: the
 * sampled values are computed and the swatch list is held by the tool, and these
 * only render them, so the tool file keeps its canvas and pointer logic.
 */

/** The colour under the cursor, the magnified pixels, and the copyable values. */
export function SampledColourPanel({
  hex,
  rgbText,
  hslText,
  magnifierRef,
  onKeep,
}: {
  hex: string | null;
  rgbText: string;
  hslText: string;
  magnifierRef: React.RefObject<HTMLCanvasElement | null>;
  onKeep: () => void;
}) {
  return (
    <div className="panel p-4">
      <SubHeading>Sampled colour</SubHeading>
      <div className="mt-3 flex items-center gap-3">
        <span
          className="size-14 shrink-0 rounded-md border border-line"
          style={{ backgroundColor: hex ?? "transparent" }}
          aria-hidden="true"
        />
        <canvas
          ref={magnifierRef}
          className="size-14 rounded-md border border-line"
          aria-label="Magnified pixels around the sample point"
          role="img"
        />
      </div>

      {hex ? (
        <dl className="mt-4 flex flex-col gap-3">
          {[
            { label: "HEX", value: hex },
            { label: "RGB", value: rgbText },
            { label: "HSL", value: hslText },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <dt className="text-xs text-muted">{row.label}</dt>
                <dd className="field-mono truncate text-sm text-fg">{row.value}</dd>
              </div>
              <CopyButton value={row.value}>
                <span className="sr-only">Copy {row.label} value</span>
              </CopyButton>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-muted">Move over the image to sample a pixel.</p>
      )}

      <button type="button" className="btn btn-primary mt-4 w-full" onClick={onKeep} disabled={!hex}>
        Keep this colour
      </button>
    </div>
  );
}

/** The colours kept so far, each copyable and removable. */
export function PalettePanel({
  swatches,
  maxSwatches,
  onRemove,
}: {
  swatches: string[];
  maxSwatches: number;
  onRemove: (value: string) => void;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-3">
        <SubHeading>Palette ({swatches.length})</SubHeading>
        {swatches.length > 0 ? <CopyButton value={swatches.join("\n")} label="Copy all" /> : null}
      </div>
      {swatches.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Up to {maxSwatches} colours can be held at once.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {swatches.map((value) => (
            <li key={value} className="flex items-center gap-2">
              <span className="field-mono flex min-w-0 flex-1 items-center gap-2.5 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-xs text-fg">
                <span
                  className="size-5 shrink-0 rounded border border-line"
                  style={{ backgroundColor: value }}
                  aria-hidden="true"
                />
                {value}
              </span>
              <CopyButton value={value}>
                <span className="sr-only">Copy {value}</span>
              </CopyButton>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRemove(value)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
