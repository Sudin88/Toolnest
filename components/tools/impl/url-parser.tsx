"use client";

import { useMemo, useState } from "react";

import { CopyButton, TextInput } from "@/components/tools/interactive";
import { Empty, Note } from "@/components/tools/parts";
import { parseUrl } from "@/lib/url-tool";

export default function UrlParser() {
  const [input, setInput] = useState("");

  const parsed = useMemo(() => parseUrl(input), [input]);

  const components = parsed.ok
    ? ([
        ["Protocol", parsed.protocol],
        ["Username", parsed.username],
        ["Password", parsed.password],
        ["Host", parsed.host],
        ["Hostname", parsed.hostname],
        ["Port", parsed.port || "(default)"],
        ["Path", parsed.pathname],
        ["Query string", parsed.search],
        ["Fragment", parsed.hash],
      ] as const)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <TextInput
        label="URL"
        value={input}
        onChange={setInput}
        mono
        inputMode="url"
        invalid={input.length > 0 && !parsed.ok}
        placeholder="https://example.com:8443/docs/page?tab=api&page=2#result"
      />

      {input.trim().length === 0 ? (
        <Empty>Paste a full URL — including the https:// — to break it into its parts.</Empty>
      ) : !parsed.ok ? (
        <p
          role="alert"
          className="rounded-md border border-highlight/45 bg-highlight/5 px-3.5 py-3 text-sm text-highlight-strong"
        >
          {parsed.error}
        </p>
      ) : (
        <>
          <section aria-labelledby="url-components">
            <h3 id="url-components" className="mb-3 font-display text-[0.9375rem] font-bold text-fg">
              Components
            </h3>
            <div className="overflow-hidden rounded-md border border-line">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-line">
                  {components.map(([label, value]) => (
                    <tr key={label} className="bg-surface">
                      <th
                        scope="row"
                        className="w-40 px-3.5 py-2.5 text-left align-top font-medium text-muted"
                      >
                        {label}
                      </th>
                      <td className="field-mono break-all px-3.5 py-2.5 align-top text-fg">
                        {value === "" ? <span className="text-muted">(none)</span> : value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="url-params">
            <h3 id="url-params" className="mb-3 font-display text-[0.9375rem] font-bold text-fg">
              Query parameters
            </h3>
            {parsed.params.length === 0 ? (
              <p className="rounded-md border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
                This URL has no query parameters.
              </p>
            ) : (
              <div className="overflow-hidden rounded-md border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      <th scope="col" className="px-3.5 py-2 font-medium">Key</th>
                      <th scope="col" className="px-3.5 py-2 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {parsed.params.map((param, index) => (
                      <tr key={`${param.key}-${index}`} className="bg-surface">
                        <th
                          scope="row"
                          className="field-mono w-40 break-all px-3.5 py-2.5 text-left align-top font-medium text-fg"
                        >
                          {param.key}
                        </th>
                        <td className="px-3.5 py-2.5 align-top">
                          <span className="field-mono break-all text-fg">{param.value || <span className="text-muted">(empty)</span>}</span>
                          {param.raw !== param.value && param.raw !== "" ? (
                            <span className="field-mono mt-1 block break-all text-xs text-muted">
                              raw: {param.raw}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <span className="label mb-0">Normalised URL</span>
              <CopyButton value={parsed.reconstructed} />
            </div>
            <output className="field-mono block break-all rounded-md border border-line bg-surface-2 px-3.5 py-3 text-[0.8125rem] text-fg">
              {parsed.reconstructed}
            </output>
          </div>
        </>
      )}

      <Note>
        Parsing uses the browser&apos;s built-in URL implementation, so addresses that contain tokens
        or signed parameters stay on your device. Values are percent-decoded for display, with the
        raw form shown alongside when the two differ.
      </Note>
    </div>
  );
}
