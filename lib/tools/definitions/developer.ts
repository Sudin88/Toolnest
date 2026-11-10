import { Binary, Braces, Fingerprint, KeyRound, Link } from "lucide-react";

import type { ToolDefinition } from "@/lib/tools/types";

export const developerTools: ToolDefinition[] = [
  {
    slug: "json-formatter",
    name: "JSON Formatter",
    category: "developer",
    tagline: "Format, validate and minify JSON",
    description:
      "Paste JSON to reformat it with indentation, minify it for transport, or find out exactly where it is invalid — with the line and column reported.",
    icon: Braces,
    keywords: ["json formatter", "json validator", "pretty print json", "minify json", "json beautifier"],
    local: true,
    status: "live",
    rank: 98,
    added: "2026-08-02",
    howTo: [
      "Paste or type JSON into the input panel.",
      "Read the status line: valid input is confirmed immediately, and invalid input names the line and column of the problem.",
      "Choose an indent size, or switch to Minify to strip all optional whitespace.",
      "Turn on key sorting when you want a stable order for diffing two payloads.",
      "Copy or download the result.",
    ],
    faqs: [
      {
        q: "Is my data sent to a server?",
        a: "No. Parsing uses the browser's own JSON parser, so the payload never leaves your machine. That matters when you are pasting a response that contains credentials or customer data.",
      },
      {
        q: "What does the error position refer to?",
        a: "The line and column of the first character the parser could not accept, which is usually either just before or just after the actual mistake — a missing comma, an unquoted key, or a trailing comma in an array.",
      },
      {
        q: "Does formatting preserve my key order?",
        a: "Yes, unless you turn on key sorting. Without sorting, insertion order is preserved exactly as it appeared in the input.",
      },
    ],
    limits: [
      "Duplicate keys are kept as written; the last value is what a parser will actually read.",
    ],
  },
  {
    slug: "base64-encoder-decoder",
    name: "Base64 Encoder / Decoder",
    category: "developer",
    tagline: "Encode text to base64 and decode it back",
    description:
      "Convert text to base64 or decode base64 back to text, with correct UTF-8 handling and support for URL-safe output and missing padding.",
    icon: Binary,
    keywords: ["base64 encode", "base64 decode", "base64 converter", "url safe base64"],
    local: true,
    status: "live",
    rank: 92,
    added: "2026-08-02",
    howTo: [
      "Paste your text or base64 string.",
      "Choose Encode or Decode.",
      "Inspect the live preview — decoding is validated as you type, so a truncated string is reported straight away.",
      "Turn on URL-safe output when the value will travel in a query string, or padding-tolerant input when you are pasting from a system that strips it.",
      "Copy or download the result.",
    ],
    faqs: [
      {
        q: "Does base64 encrypt my data?",
        a: "No. Base64 is a transport encoding, not encryption — anyone can decode it. Use it to move bytes safely through text-only channels, never to protect a secret.",
      },
      {
        q: "Why does decoded output look like mojibake?",
        a: "The input is not text, or it was decoded with the wrong character set. Base64 usually carries binary data such as an image, and decoding arbitrary bytes as UTF-8 produces replacement characters.",
      },
    ],
  },
  {
    slug: "uuid-generator",
    name: "UUID Generator",
    category: "developer",
    tagline: "Generate RFC 9562 v4 and v7 identifiers",
    description:
      "Generate cryptographically random UUID v4 values, or time-ordered v7 values that sort correctly in a database index, one at a time or in bulk.",
    icon: Fingerprint,
    keywords: ["uuid generator", "guid generator", "uuid v4", "uuid v7", "bulk uuid"],
    local: true,
    status: "live",
    rank: 86,
    added: "2026-08-09",
    howTo: [
      "Choose UUID v4 for a purely random identifier, or v7 when you want identifiers that sort in creation order.",
      "Set how many you need, then generate.",
      "Toggle uppercase, or remove hyphens for a compact form, if a system requires it.",
      "Copy the list or download it as a text file.",
    ],
    faqs: [
      {
        q: "What is the difference between UUID v4 and v7?",
        a: "Version 4 is entirely random. Version 7 begins with a millisecond timestamp, so identifiers generated later sort after earlier ones — which keeps database indexes dense instead of scattered.",
      },
      {
        q: "How random are these identifiers?",
        a: "They are generated with the browser's cryptographically secure random number generator, the same source used for encryption keys.",
      },
      {
        q: "Could two UUIDs ever collide?",
        a: "A version 4 UUID has 122 random bits. You would need to generate about 2.7 trillion of them before a collision became likely, which is why they are treated as unique in practice.",
      },
    ],
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    category: "developer",
    tagline: "Strong random passwords, generated on your device",
    description:
      "Generate strong passwords with cryptographic randomness. Choose the length and character sets, exclude ambiguous characters, and copy without the value ever leaving your browser.",
    icon: KeyRound,
    keywords: ["password generator", "strong password", "random password", "secure password online"],
    local: true,
    status: "live",
    rank: 94,
    added: "2026-08-09",
    howTo: [
      "Set the length — 16 characters or more is a sensible default for anything you care about.",
      "Pick the character sets you need. Numbers and symbols are usually required; ambiguity-free mode removes characters that are easily misread.",
      "Read the strength estimate, which is based on the real size of the character pool you selected.",
      "Copy the password into your password manager. Then paste it somewhere safe, because it is not stored here.",
    ],
    faqs: [
      {
        q: "Is it safe to generate a password in a web page?",
        a: "Here it is, because the value is produced with the browser's cryptographic random generator, shown once, and never written to storage or sent over the network. The generated password is discarded when you leave the page.",
      },
      {
        q: "How long should a password be?",
        a: "Length beats symbol soup. At 16 characters using letters, digits and symbols the search space is beyond practical brute force. Passphrases of four or five random words are equally strong and far easier to type.",
      },
      {
        q: "What does excluding ambiguous characters do?",
        a: "It removes letters and digits that are easy to confuse when read aloud or copied by hand, such as l, I, 1, O and 0 — useful when a human has to retype the password.",
      },
    ],
    limits: [
      "Nothing is stored — the password is gone as soon as you navigate away or reload, so copy it before you do.",
      "It does not check passwords against breach lists or rate strength against a specific attacker model.",
      "Values are generated locally, so there is no vault, sync or history.",
    ],
  },
  {
    slug: "url-parser",
    name: "URL Parser",
    category: "developer",
    tagline: "Break a URL into protocol, host, path and query",
    description:
      "Split any URL into its components — protocol, host, port, path, query parameters and fragment — and read query values as a clean table.",
    icon: Link,
    keywords: ["url parser", "query string parser", "url components", "parse url online"],
    local: true,
    status: "live",
    rank: 68,
    added: "2026-08-16",
    howTo: [
      "Paste a full URL, including the scheme if you have it.",
      "Read the components table for protocol, hostname, port, path and fragment.",
      "Check the query parameter table, which decodes each value and shows repeated keys separately.",
      "Use the reconstructed URL to confirm that the parts still assemble into the address you expect.",
    ],
    faqs: [
      {
        q: "What happens if I paste a URL without a scheme?",
        a: "The tool reports that the input is relative rather than guessing a protocol. A URL needs a scheme such as https:// before it can be split into authority and path.",
      },
      {
        q: "Are parameters decoded?",
        a: "Yes. Percent escapes and + signs are decoded for display, and the raw value is shown alongside when the two differ.",
      },
      {
        q: "Is the URL sent anywhere?",
        a: "No. Parsing uses the browser's built-in URL implementation, so URLs that contain tokens or signed parameters stay on your device.",
      },
    ],
  },
];
