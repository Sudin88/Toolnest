/**
 * Small browser-side helpers shared by the tools. Everything here runs in the
 * visitor's tab; nothing in this module touches the network.
 */

/** iPadOS 13+ reports itself as "Macintosh"; its touch points give it away. */
function isAppleHandheld(): boolean {
  const ua = navigator.userAgent;
  return /iP(hone|ad|od)/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/**
 * Save a blob through a temporary anchor.
 *
 * The object URL is deliberately held for a minute. iOS Safari shows a
 * confirmation before it reads the blob, so a URL revoked on a short timer is
 * already dead by the time the visitor taps through the prompt, and Safari then
 * shows nothing at all: the button looks broken with no error to explain it.
 * The anchor and the URL cost a few kilobytes until the timer fires.
 */
function anchorDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
}

/**
 * Offer a produced file for saving.
 *
 * Two paths, because iOS and everything else want different things. The plain
 * anchor download works everywhere else. On an Apple handheld the system share
 * sheet is preferred when the browser can share a file: it offers an explicit
 * "Save to Files", and it does not depend on Safari's blob-download behaviour,
 * which has been unreliable for years.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (
    isAppleHandheld() &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function"
  ) {
    const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });
    if (navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: filename }).catch((cause: unknown) => {
        // Dismissing the sheet is a decision, not a failure; anything else still
        // gets the plain download as a fallback.
        if (!(cause instanceof DOMException) || cause.name !== "AbortError") {
          anchorDownload(blob, filename);
        }
      });
      return;
    }
  }
  anchorDownload(blob, filename);
}

export function downloadText(text: string, filename: string, mime = "text/plain") {
  downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
}

/** Returns true when the clipboard write succeeded. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or insecure context — fall through to the legacy path.
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
