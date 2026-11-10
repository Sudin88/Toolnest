import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { pageMetadata } from "@/lib/seo";
import { adsEnabled, siteConfig } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What ToolNest collects, what it does not, and what happens to the files you process — in plain English.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        intro="This page describes what the site actually does, matching the code that runs it. The short version is that your files are processed on your device and there is no account, no upload and no profile."
      />

      <div className="container-page pb-20 pt-12">
        <div className="prose-tool measure">
          <h2>The short version</h2>
          <ul>
            <li>No account, no sign-in, no profile.</li>
            <li>Files you open in a tool are processed in your browser and are not transmitted.</li>
            <li>
              The only things stored in your browser are the tools you opened recently, under the key{" "}
              <code>toolnest-recents</code>, and a tab-scoped draft of small inputs under{" "}
              <code>toolnest-draft</code>.
            </li>
            <li>No analytics or tracking scripts run unless this deployment has turned them on.</li>
          </ul>

          <h2>Files you process</h2>
          <p>
            Every tool that accepts a file — image compression, resizing, format conversion, image to
            PDF, colour picking, base64 inlining and the PDF tools — works on the file inside your
            browser. The image is decoded by the Canvas API, the PDF is assembled by pdf-lib, and the
            result is written back to your device. Nothing in that path sends the file anywhere,
            because there is no server-side endpoint to send it to.
          </p>
          <p>
            Each tool page states whether it is local. Where a future tool cannot keep that promise,
            the page will say so plainly instead of leaving you to guess.
          </p>

          <h2>Text and numbers you type</h2>
          <p>
            Text pasted into the word counter, the case converter or the JSON formatter is held in the
            page&rsquo;s memory for as long as the tab is open, and is gone when you close or reload it.
            Numbers entered into a calculator are used for the calculation and nothing else.
          </p>

          <h2>What the server sees</h2>
          <p>
            Like any website, the server that delivers the pages receives the ordinary technical
            details of a request: your IP address, the browser&rsquo;s user agent, the page requested and
            the time. This is standard request logging kept by the hosting provider and is used for
            security and reliability, not to build a picture of you.
          </p>

          <h2>Cookies and local storage</h2>
          <p>
            The site itself sets no cookies for the tools to work — there is no session to maintain. It
            writes a list of recently opened tools to your browser&rsquo;s local storage, and a
            tab-scoped draft of small inputs to session storage, so a reload does not lose your place.
            The{" "}
            <Link href="/cookies" className="link">
              cookies page
            </Link>{" "}
            has the detail.
          </p>

          <h2>Advertising</h2>
          {adsEnabled ? (
            <>
              <p>
                This deployment shows advertising through Google AdSense to keep the tools free. Google
                and its partners may set cookies or read advertising identifiers in order to serve and
                measure ads. That processing is controlled by Google, not by ToolNest, and you can
                review or change your advertising preferences through Google&rsquo;s ad settings.
              </p>
              <p>
                Where the law requires it — in the EEA and the UK, for example — personalised
                advertising must be preceded by a consent prompt, and this deployment is responsible
                for showing one before ads that rely on it are served.
              </p>
            </>
          ) : (
            <p>
              Advertising is not currently enabled on this deployment. When a real publisher ID is
              configured, Google AdSense will be used to keep the tools free, and it may set cookies
              or read advertising identifiers to serve and measure ads. This page and the cookies page
              describe that arrangement so it is not a surprise when it starts.
            </p>
          )}

          <h2>Third parties</h2>
          <p>
            The only third parties involved are the hosting provider that serves the pages, and Google
            if advertising is switched on. Your files are never shared with either, because neither
            ever receives them.
          </p>

          <h2>Your choices</h2>
          <ul>
            <li>Clearing site data in your browser removes the stored list of recent tools.</li>
            <li>Blocking or clearing cookies does not break any tool.</li>
            <li>
              You can opt out of personalised advertising through Google&rsquo;s ad settings or your
              browser&rsquo;s tracking protections.
            </li>
          </ul>

          <h2>Children</h2>
          <p>
            The site is aimed at a general audience and is not directed at children under 13. Nothing
            here asks for personal information, so there is nothing of that kind to collect.
          </p>

          <h2>Changes</h2>
          <p>
            If what the site does changes, this page changes with it. The date at the bottom is the
            last time that happened.
          </p>

          <h2>Contact</h2>
          <p>
            {siteConfig.contactEmail ? (
              <>
                Questions about any of this can go to{" "}
                <a href={`mailto:${siteConfig.contactEmail}`} className="link">
                  {siteConfig.contactEmail}
                </a>
                .
              </>
            ) : (
              <>
                See the{" "}
                <Link href="/contact" className="link">
                  contact page
                </Link>{" "}
                for how to get in touch.
              </>
            )}
          </p>

          <p>
            <strong>Last updated:</strong> 20 August 2026.
          </p>
          <p>
            This policy is written to describe the software accurately. It is not legal advice, and a
            deployment serving a particular jurisdiction should have it reviewed by someone qualified.
          </p>
        </div>
      </div>
    </>
  );
}
