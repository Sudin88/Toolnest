/**
 * Runs synchronously in <head> during HTML parsing — before first paint — so the
 * stored theme is applied without a flash. `suppressHydrationWarning` on <html>
 * lets React accept the attribute the script set.
 *
 * Keep this string dependency-free and tiny: it is on the critical path.
 */
export const THEME_STORAGE_KEY = "toolnest-theme";

const themeScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");var e=document.documentElement;e.setAttribute("data-theme",t);e.style.colorScheme=t;}catch(e){}})()`;

export function ThemeScript() {
  return (
    <script
      // eslint-disable-next-line react/no-danger -- static, self-authored string
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}

/** Read the theme currently applied to <html>. Safe on the server. */
export function readAppliedTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/** Apply a theme and persist it. Browser-only. */
export function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The theme
    // still applies for this page view; it just will not persist.
  }
}
