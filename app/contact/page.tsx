import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { pageMetadata } from "@/lib/seo";
import { contactEmailHref, siteConfig } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Report a broken tool, request something new, or ask about how AllTools handles your data.",
  path: "/contact",
});

export default function ContactPage() {
  const email = siteConfig.contactEmail;

  return (
    <>
      <PageHeader
        title="Contact"
        intro="AllTools is a small project. If something is broken or missing, saying so is genuinely useful. The reports that help most describe what you expected, what happened instead, and which browser you were using."
      />

      <div className="container-page pb-20 pt-12">
        <div className="prose-tool measure">
          <h2>Email</h2>
          {email ? (
            <>
              <p>
                Write to{" "}
                <a href={contactEmailHref ?? undefined} className="link">
                  {email}
                </a>
                . A reply is not guaranteed, but every message is read.
              </p>
            </>
          ) : (
            <p>
              A monitored contact address has not been configured for this deployment yet. Until one
              is, treat this page as a placeholder: whoever runs this site needs to set{" "}
              <code>NEXT_PUBLIC_CONTACT_EMAIL</code> before pointing people here.
            </p>
          )}

          <h2>Reporting a bug</h2>
          <p>Four details turn a report into something that can actually be fixed:</p>
          <ul>
            <li>The tool and the exact steps you took.</li>
            <li>What you expected and what happened instead.</li>
            <li>The browser and version, and whether you were on desktop or mobile.</li>
            <li>The file itself, if the problem only appears with one particular file.</li>
          </ul>
          <p>
            Please do not send files that contain anything confidential. A small reproduction is
            always more useful than a large real one.
          </p>

          <h2>Requesting a tool</h2>
          <p>
            Requests are welcome, and the strongest ones describe the job rather than the
            implementation: what you were trying to do, which site you used instead, and what annoyed
            you about it. That is usually enough to tell whether the tool belongs here.
          </p>

          <h2>Privacy questions</h2>
          <p>
            The short version is that your files are processed in your browser and are not sent to a
            server. The{" "}
            <Link href="/privacy" className="link">
              privacy page
            </Link>{" "}
            sets out exactly what the site does and does not collect, and the{" "}
            <Link href="/cookies" className="link">
              cookies page
            </Link>{" "}
            covers the theme preference and advertising.
          </p>

          <h2>What this cannot help with</h2>
          <p>
            Because nothing is uploaded, there is no copy of your file anywhere to recover. If a
            download did not arrive, the source is still on your device and the tool can simply be run
            again.
          </p>
        </div>
      </div>
    </>
  );
}
