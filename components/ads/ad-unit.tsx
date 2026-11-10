"use client";

import { useEffect, useRef } from "react";

import { siteConfig } from "@/lib/site";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Mounts one AdSense unit. Only rendered when a publisher id is configured, so
 * nothing here ever runs in development or on an unconfigured deploy.
 */
export function AdUnit({ slot }: { slot: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not available (blocked, offline). The reserved space stays empty
      // rather than collapsing and shifting the content below it.
    }
  }, []);

  return (
    <ins
      className="adsbygoogle block"
      data-ad-client={siteConfig.adsenseClient}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
