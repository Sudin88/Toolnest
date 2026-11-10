"use client";

import { useEffect, useState } from "react";

import { ImageFacts, ImagePreview, useImageFile } from "@/components/tools/image-workbench";
import { CopyButton, FileDrop } from "@/components/tools/interactive";
import { Empty, Note, Stat, StatGrid, SubHeading } from "@/components/tools/parts";
import { readFileAsDataUrl, formatLabel } from "@/lib/image";
import { formatBytes, formatNumber } from "@/lib/utils";

const SMALL_ENOUGH_BYTES = 2 * 1024;

export default function ImageToBase64() {
  const { image, file, url, error, busy, load, setError } = useImageFile();
  const [dataUri, setDataUri] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setDataUri(null);
      return;
    }
    let cancelled = false;
    readFileAsDataUrl(file)
      .then((value) => {
        if (!cancelled) setDataUri(value);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "The file could not be read.");
      });
    return () => {
      cancelled = true;
    };
  }, [file, setError]);

  const raw = dataUri ? dataUri.slice(dataUri.indexOf(",") + 1) : "";
  const cssValue = dataUri ? `background-image: url("${dataUri}");` : "";
  const htmlValue = dataUri
    ? `<img src="${dataUri}" alt="" width="${image?.width ?? 0}" height="${image?.height ?? 0}">`
    : "";
  const inflation = dataUri && image ? Math.round((dataUri.length / image.size - 1) * 100) : 0;
  const tooBig = image ? image.size > SMALL_ENOUGH_BYTES : false;

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label="Drop an image here"
        hint="It is read as a data URI — no network request is involved."
        accept="image/*"
        onFile={(files) => void load(files)}
      />

      {error ? <Note tone="warn">{error}</Note> : null}
      {busy ? <p className="text-sm text-muted">Reading the file…</p> : null}

      {image ? (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            <div className="panel flex flex-col gap-4 p-4">
              <h3 className="font-display text-[0.9375rem] font-bold text-fg">Preview</h3>
              <div className="flex max-h-56 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-2">
                <ImagePreview src={url} alt={`Preview: ${image.name}`} />
              </div>
              <ImageFacts
                name={image.name}
                width={image.width}
                height={image.height}
                size={image.size}
                type={image.type}
              />
            </div>

            <div className="flex flex-col gap-4">
              {dataUri ? (
                <StatGrid className="lg:grid-cols-3">
                  <Stat label="Original file" value={formatBytes(image.size)} hint={formatLabel(image.type)} />
                  <Stat
                    label="Data URI length"
                    value={`${formatNumber(dataUri.length)} chars`}
                    hint="Characters, each one byte"
                  />
                  <Stat
                    label="Inflation"
                    value={`+${inflation}%`}
                    hint="Base64 turns three bytes into four"
                  />
                </StatGrid>
              ) : (
                <p className="text-sm text-muted">Reading the file…</p>
              )}

              {tooBig ? (
                <Note tone="warn">
                  At {formatBytes(image.size)} this is well past the point where inlining pays off. Base64
                  adds roughly a third on top, and those extra bytes ride along in every page load while
                  no longer being cacheable on their own. Inline icons under about two kilobytes; send
                  anything larger as a file.
                </Note>
              ) : (
                <Note>
                  At {formatBytes(image.size)} this is small enough that inlining can be worthwhile — it
                  saves a network round trip. Remember that it also stops the image from being cached
                  separately from the document that contains it.
                </Note>
              )}
            </div>
          </div>

          {dataUri ? (
            <>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <SubHeading id="base64-uri">Data URI</SubHeading>
                  <CopyButton value={dataUri} label="Copy data URI" />
                </div>
                <pre className="scroll-region field-mono mt-3 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-md border border-line bg-surface-2 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-fg">
                  {dataUri}
                </pre>
              </div>

              <div>
                <SubHeading id="base64-raw">Raw base64</SubHeading>
                <p className="mt-1.5 text-xs text-muted">The part after the comma, without the media type.</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <CopyButton value={raw} label="Copy raw base64" />
                  <span className="num text-xs text-muted">{formatNumber(raw.length)} characters</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="panel flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <SubHeading>CSS</SubHeading>
                    <CopyButton value={cssValue} label="Copy CSS" />
                  </div>
                  <pre className="field-mono scroll-region max-h-20 overflow-auto whitespace-pre-wrap break-all rounded-md border border-line bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted">
                    {cssValue}
                  </pre>
                </div>
                <div className="panel flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <SubHeading>HTML</SubHeading>
                    <CopyButton value={htmlValue} label="Copy HTML" />
                  </div>
                  <pre className="field-mono scroll-region max-h-20 overflow-auto whitespace-pre-wrap break-all rounded-md border border-line bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted">
                    {htmlValue}
                  </pre>
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : (
        <Empty>Load an image and its data URI appears here.</Empty>
      )}
    </div>
  );
}
