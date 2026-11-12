import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { pageMetadata } from "@/lib/seo";
import { adsEnabled } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Cookies",
  description:
    "AllTools sets no cookies for its tools to work. Here are the four values it keeps in your browser, and what advertising does when it is enabled.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <>
      <PageHeader
        title="Cookies"
        intro="Most sites need a long cookie page because they track a lot. This one is short because AllTools does not: no session, no sign-in, no analytics running by default."
      />

      <div className="container-page pb-20 pt-12">
        <div className="prose-tool measure">
          <h2>The short version</h2>
          <ul>
            <li>The tools work with cookies blocked entirely.</li>
            <li>
              Four values are held in your browser, and none is a cookie: the tools you opened
              recently, the tools you marked as favourites, a short-lived draft of the inputs in the
              tab you are using, and the text handed over from the home box.
            </li>
            <li>Advertising cookies only appear if this deployment has enabled ads.</li>
          </ul>

          <h2>Strictly necessary cookies</h2>
          <p>
            There are none. The tools run entirely in the page, so there is no session to keep alive
            and nothing that has to be sent back with every request. If you block all cookies, every
            tool still works.
          </p>

          <h2>Local storage</h2>
          <p>The site stores two keys in your browser&rsquo;s local storage:</p>
          <ul>
            <li>
              <code>toolnest-recents</code>: a list of the tool identifiers you opened most recently,
              so the home page and the search palette can offer them back. It holds slugs only, never
              anything you typed or opened, and clearing your browser&rsquo;s site data removes it.
            </li>
            <li>
              <code>toolnest-favourites</code>: the tool identifiers you marked as favourites, so
              they can be offered first. Like the recents list it holds slugs only, and clearing your
              browser&rsquo;s site data removes it.
            </li>
          </ul>
          <p>
            Local storage is not sent to the server with each request the way a cookie is, which is
            part of why it is a good fit here.
          </p>

          <h2>Session storage</h2>
          <p>
            The site also keeps two keys in <code>sessionStorage</code>, which are discarded the
            moment the tab closes:
          </p>
          <ul>
            <li>
              <code>toolnest-draft</code>: a short draft of the small inputs in a calculator or a
              text tool, so a reload does not lose a number you were part-way through. It is scoped to
              the tab, and tools that handle files, passwords or tokens never use it.
            </li>
            <li>
              <code>toolnest-handover</code>: the text you dropped into the home box, held just long
              enough for the tool it opens to read it once. It is deleted the moment it is read, so
              the next visit starts clean.
            </li>
          </ul>

          <h2>Advertising cookies</h2>
          {adsEnabled ? (
            <>
              <p>
                This deployment has advertising enabled. Google AdSense and its partners may set
                cookies or read advertising identifiers to serve, cap and measure ads. Typical
                purposes include frequency capping, measuring how many people saw an ad, and, where
                consent has been given, selecting ads based on interests.
              </p>
              <p>
                Those cookies are set by Google, not by AllTools, and they are not set inside any tool
                or around its controls. You can review or change what Google uses by visiting
                Google&rsquo;s ad settings, and you can block third-party cookies in your browser without
                affecting any tool.
              </p>
              <p>
                In regions where consent is required, such as the EEA and the UK, this
                deployment must show a consent prompt before personalised advertising cookies are used.
              </p>
            </>
          ) : (
            <p>
              Advertising is not enabled on this deployment, so no advertising cookies are set. When a
              publisher ID is configured, Google AdSense may set cookies or read advertising
              identifiers to serve and measure ads, set by Google rather than by AllTools. In regions
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
            step for limiting advertising trackers, and it will not stop any AllTools tool from
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
