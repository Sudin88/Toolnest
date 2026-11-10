import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description:
    "The terms you agree to by using ToolNest: free to use, provided as-is, and you keep ownership of everything you process.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Terms of Use"
        intro="Plain terms for a free tool site. By using ToolNest you agree to what follows, so it is worth the two minutes it takes to read."
      />

      <div className="container-page pb-20 pt-12">
        <div className="prose-tool measure">
          <h2>Using the site</h2>
          <p>
            ToolNest is free to use for personal and commercial work. You do not need to register, and
            there is no usage limit other than not deliberately trying to break the service — bulk
            automated requests that degrade it for everyone else, attempts to bypass security, or
            anything that would put the site in legal jeopardy are not permitted.
          </p>

          <h2>Your content stays yours</h2>
          <p>
            You keep all rights to the files and text you process. Because everything runs in your
            browser, the site never receives them and claims no licence over them. You are responsible
            for having the right to work with whatever you open in a tool.
          </p>

          <h2>The tools are provided as-is</h2>
          <p>
            Every tool is offered without warranty of any kind, express or implied. There is no promise
            that a tool will be available, uninterrupted or free of defects, and no promise that a
            particular output will suit a particular purpose.
          </p>
          <p>
            <strong>Keep your originals.</strong> Work on a copy until you have checked the result. No
            upload happens, which also means no copy of your file exists anywhere to recover from.
          </p>

          <h2>Calculators are estimates, not advice</h2>
          <p>
            Results from the calculators are arithmetic, nothing more. The BMI calculator is a
            screening number and not a medical diagnosis, and it is not intended for children. The loan
            calculator covers principal and interest only and ignores fees, insurance and tax; it is
            not financial advice. The date and age tools follow the calendar conventions documented on
            their own pages. For anything that matters — health, money, contracts — confirm the result
            with a qualified professional.
          </p>

          <h2>Availability</h2>
          <p>
            The site may change, and any tool may be modified or withdrawn. Because the tools run on
            your device, work already completed is unaffected — a tool cannot reach into a file you
            have already downloaded.
          </p>

          <h2>Advertising</h2>
          <p>
            Advertising keeps the tools free. Ads are labelled and kept out of the working area, and
            the{" "}
            <Link href="/privacy" className="link">
              privacy policy
            </Link>{" "}
            explains what that involves. ToolNest does not endorse advertised products and is not
            responsible for them.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, ToolNest is not liable for any loss arising from use
            of the site, including lost or corrupted files, lost time, or a decision taken on the basis
            of a calculated result. Nothing here excludes liability that cannot lawfully be excluded.
          </p>

          <h2>Changes to these terms</h2>
          <p>
            These terms may be updated; the date below records the last change. Continuing to use the
            site after a change means you accept the updated version.
          </p>

          <h2>Questions</h2>
          <p>
            {siteConfig.contactEmail ? (
              <>
                Reach out at{" "}
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
                </Link>
                .
              </>
            )}
          </p>

          <p>
            <strong>Last updated:</strong> 20 August 2026.
          </p>
          <p>
            These terms are written to be readable and accurate. They are not legal advice, and a
            deployment serving a particular jurisdiction should have them reviewed by someone
            qualified.
          </p>
        </div>
      </div>
    </>
  );
}
