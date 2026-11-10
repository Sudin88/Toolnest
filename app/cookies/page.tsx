import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { pageMetadata } from "@/lib/seo";
import { adsEnabled } from "@/lib/site";
import { THEME_STORAGE_KEY } from "@/components/theme/theme-script";

export const metadata: Metadata = pageMetadata({
  title: "Cookies",
  description:
    "ToolNest sets no cookies for its tools to work. Here is the single value it stores in your browser, and what advertising does when it is enabled.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <>
      <PageHeader
        title="Cookies"
        intro="Most sites need a long cookie page because they track a lot. This one is short because ToolNest does not: no session, no sign-in, no analytics running by default."
      />

      <div className="container-page pb-20 pt-12">
        <div className="prose-tool measure">
          <h2>The short version</h2>
          <ul>
            <li>The tools work with cookies blocked entirely.</li>
            <li>One value is stored in local storage, and it is not a cookie: your theme choice.</li>
            <li>Advertising cookies only appear if this deployment has enabled ads.</li>
          </ul>

          <h2>Strictly necessary cookies</h2>
          <p>
            There are none. The tools run entirely in the page, so there is no session to keep alive
            and nothing that has to be sent back with every request. If you block all cookies, every
            tool still works.
          </p>

          <h2>Local storage</h2>
          <p>
            The site stores one key in your browser&rsquo;s local storage:
          </p>
          <ul>
            <li>
              <code>{THEME_STORAGE_KEY}</code> — either <code>&quot;light&quot;</code> or{" "}
              <code>&quot;dark&quot;</code>, so the theme you picked is applied before the page paints
              on your next visit. It contains nothing about you, and clearing your browser&rsquo;s site
              data removes it. Without it, the site simply falls back to your system preference.
            </li>
          </ul>
          <p>
            Local storage is not sent to the server with each request the way a cookie is, which is
            part of why it is a good fit here.
          </p>

          <h2>Advertising cookies</h2>
          {adsEnabled ? (
            <>
              <p>
                This deployment has advertising enabled. Google AdSense and its partners may set
                cookies or read advertising identifiers to serve, cap and measure ads. Typical
                purposes include frequency capping, measuring how many people saw an ad, and — where
                consent has been given — selecting ads based on interests.
              </p>
              <p>
                Those cookies are set by Google, not by ToolNest, and they are not set inside any tool
                or around its controls. You can review or change what Google uses by visiting
                Google&rsquo;s ad settings, and you can block third-party cookies in your browser without
                affecting any tool.
              </p>
              <p>
                In regions where consent is required — the EEA and the UK, for example — this
                deployment must show a consent prompt before personalised advertising cookies are used.
              </p>
            </>
          ) : (
            <p>
              Advertising is not enabled on this deployment, so no advertising cookies are set. When a
              publisher ID is configured, Google AdSense may set cookies or read advertising
              identifiers to serve and measure ads, set by Google rather than by ToolNest. In regions
              where consent is required, a prompt must appear before personalised advertising cookies
              are used.
            </p>
          )}

          <h2>Analytics</h2>
          <p>
            No analytics script runs by default. If one is added later, this page will list it by name
            and say what it collects.
          </p>

          <h2>Managing cookies</h2>
          <p>
            Every major browser lets you block or delete cookies and clear site data, usually from the
            privacy section of its settings. Blocking third-party cookies is the single most effective
            step for limiting advertising trackers, and it will not stop any ToolNest tool from
            working.
          </p>

          <h2>More detail</h2>
          <p>
            The{" "}
            <Link href="/privacy" className="link">
              privacy policy
            </Link>{" "}
            covers what the site does and does not collect beyond cookies.
          </p>

          <p>
            <strong>Last updated:</strong> 20 August 2026.
          </p>
        </div>
      </div>
    </>
  );
}
