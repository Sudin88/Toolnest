import { ImagePreview } from "@/components/tools/image-workbench";
import { NumberInput, Select } from "@/components/tools/interactive";
import { Note, SubHeading } from "@/components/tools/parts";
import type { ImageFit, ImageOrientation, ImagePageGeometry, ImagePageSize } from "@/lib/pdf";

/**
 * Presentational pieces for Images to PDF. They hold no batch state and no
 * build logic — the tool passes the current setup down and receives a patch
 * back, so the page controls and the page preview stay out of the tool's body.
 */

export interface PageSetup {
  pageSize: ImagePageSize;
  orientation: ImageOrientation;
  fit: ImageFit;
  margin: number | "";
}

export function PageSetupControls({
  value,
  onChange,
}: {
  value: PageSetup;
  onChange: (patch: Partial<PageSetup>) => void;
}) {
  const { pageSize, orientation, fit, margin } = value;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Select
        label="Page size"
        value={pageSize}
        onChange={(next) => onChange({ pageSize: next as ImagePageSize })}
        options={[
          { value: "a4", label: "A4 (210 × 297 mm)" },
          { value: "letter", label: "Letter (8.5 × 11 in)" },
          { value: "match", label: "Match each image exactly" },
        ]}
      />
      <Select
        label="Orientation"
        value={orientation}
        onChange={(next) => onChange({ orientation: next as ImageOrientation })}
        options={[
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
          { value: "auto", label: "Auto from each image" },
        ]}
        disabled={pageSize === "match"}
        hint={pageSize === "match" ? "The page follows the image." : undefined}
      />
      <Select
        label="Fit"
        value={fit}
        onChange={(next) => onChange({ fit: next as ImageFit })}
        options={[
          { value: "contain", label: "Fit inside the page (no cropping)" },
          { value: "fill", label: "Fill the page (may crop edges)" },
        ]}
        disabled={pageSize === "match"}
      />
      <NumberInput
        label="Margin (mm)"
        value={margin}
        onChange={(next) => onChange({ margin: next })}
        min={0}
        max={60}
        hint={pageSize === "match" ? "Ignored when the page matches the image." : "Applied to every edge."}
      />
    </div>
  );
}

/**
 * Where the first image lands on its page, drawn to scale. Showing the first
 * image is what makes the four setup controls above legible, and this preview
 * is the only place the tool has to keep the page geometry in view.
 */
export function PageSetupPreview({
  entry,
  geometry,
  pageLabel,
}: {
  entry: { name: string; url: string; width: number };
  geometry: ImagePageGeometry;
  pageLabel: string;
}) {
  return (
    <div className="panel p-4">
      <SubHeading>Page setup, using “{entry.name}”</SubHeading>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className="relative mx-auto w-full max-w-[13rem] shrink-0 overflow-hidden rounded-sm border border-line bg-white sm:mx-0"
          style={{ aspectRatio: `${geometry.pageW} / ${geometry.pageH}` }}
        >
          <div
            className="absolute overflow-hidden"
            style={{
              left: `${(geometry.x / geometry.pageW) * 100}%`,
              bottom: `${(geometry.y / geometry.pageH) * 100}%`,
              width: `${(geometry.drawW / geometry.pageW) * 100}%`,
              height: `${(geometry.drawH / geometry.pageH) * 100}%`,
            }}
          >
            <ImagePreview
              src={entry.url}
              alt="Where the first image sits on its page"
              className="size-full object-cover"
            />
          </div>
          {geometry.cropped ? (
            <span className="absolute inset-0 border border-dashed border-highlight/60" aria-hidden="true" />
          ) : null}
        </div>
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Page</dt>
            <dd className="num text-fg">
              {geometry.pageW.toFixed(1)} × {geometry.pageH.toFixed(1)} pt
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Image on page</dt>
            <dd className="num text-fg">
              {geometry.drawW.toFixed(1)} × {geometry.drawH.toFixed(1)} pt
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted">Result</dt>
            <dd className="text-fg">
              {pageLabel}
              {geometry.cropped ? " · edges cropped" : ""}
            </dd>
          </div>
        </dl>
      </div>
      <Note tone="info">
        At 300 pixels per inch, the usual target for print, this image covers about{" "}
        {(entry.width / 300).toFixed(1)} in across. It will still display correctly on screen at any
        size.
      </Note>
    </div>
  );
}
