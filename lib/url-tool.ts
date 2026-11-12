/**
 * URL decomposition for the URL Parser tool. Uses the browser's own URL parser,
 * so URLs containing tokens or signed parameters never leave the device.
 */

interface QueryParam {
  key: string;
  /** Percent-decoded value. */
  value: string;
  /** The value exactly as it appeared, before decoding. */
  raw: string;
}

interface ParsedUrl {
  ok: true;
  protocol: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  params: QueryParam[];
  reconstructed: string;
}

type UrlParseResult = ParsedUrl | { ok: false; error: string };

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

export function parseUrl(input: string): UrlParseResult {
  const value = input.trim();
  if (value.length === 0) return { ok: false, error: "Paste a URL to break it apart." };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return {
      ok: false,
      error:
        "That is not an absolute URL. A URL needs a scheme such as https:// before it can be split into host and path.",
    };
  }

  const params: QueryParam[] = url.search
    .replace(/^\?/, "")
    .split("&")
    .filter(Boolean)
    .map((pair) => {
      const eq = pair.indexOf("=");
      const rawKey = eq === -1 ? pair : pair.slice(0, eq);
      const rawValue = eq === -1 ? "" : pair.slice(eq + 1);
      return { key: safeDecode(rawKey), value: safeDecode(rawValue), raw: rawValue };
    });

  return {
    ok: true,
    protocol: url.protocol.replace(/:$/, ""),
    username: safeDecode(url.username),
    password: safeDecode(url.password),
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: safeDecode(url.pathname),
    search: url.search,
    hash: url.hash,
    params,
    reconstructed: url.toString(),
  };
}
