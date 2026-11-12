import {
  FaArrowDownAZ,
  FaCodeCompare,
  FaFont,
  FaLink,
  FaListCheck,
  FaParagraph,
  FaTextWidth,
} from "react-icons/fa6";

import type { ToolDefinition } from "@/lib/tools/types";

export const textTools: ToolDefinition[] = [
  {
    slug: "word-counter",
    name: "Word Counter",
    category: "text",
    tagline: "Words, sentences, paragraphs and reading time",
    description:
      "Count words, characters, sentences and paragraphs as you type, with estimated reading time and keyword density. Nothing is uploaded; the count runs in your browser.",
    icon: FaFont,
    keywords: ["word count", "count words online", "reading time", "essay length", "keyword density"],
    local: true,
    status: "live",
    rank: 96,
    added: "2026-08-04",
    howTo: [
      "Type or paste your text into the box. Counts update on every keystroke; there is no process button.",
      "Read the summary strip for words, characters, sentences and paragraphs.",
      "Check the reading-time estimate when you are writing to a length or time limit.",
      "Open the keyword list to see which terms you use most, and whether that matches the point you are making.",
      "Use Copy summary when you need to paste the numbers somewhere else.",
    ],
    faqs: [
      {
        q: "How is word count calculated?",
        a: "Text is split on whitespace after collapsing runs of spaces, tabs and line breaks, so hyphenated words and contractions each count once. Numbers count as words.",
      },
      {
        q: "Is my text uploaded anywhere?",
        a: "No. Counting happens in your browser and the text is discarded when you close the tab. Nothing is sent to AllTools.",
      },
      {
        q: "How is reading time estimated?",
        a: "At 200 words per minute for prose and 130 for dense copy, which are the usual planning figures. It is an estimate, not a measurement of your own reading speed.",
      },
    ],
    limits: [
      "Words are split on whitespace, so languages written without spaces (Chinese, Japanese, Thai) count as roughly one word per sentence.",
      "Reading time is a fixed words-per-minute estimate, not a measure of your own speed.",
      "Sentence detection is punctuation-based, so abbreviations, decimals and ellipses can mislead it.",
    ],
  },
  {
    slug: "character-counter",
    name: "Character Counter",
    category: "text",
    tagline: "Character and byte limits for posts and metadata",
    description:
      "Count characters with and without spaces, then check your text against real limits for meta descriptions, titles, tweets and SMS messages.",
    icon: FaTextWidth,
    keywords: ["character counter", "character limit", "twitter character count", "meta description length"],
    local: true,
    status: "live",
    rank: 88,
    added: "2026-08-06",
    howTo: [
      "Paste your text into the box.",
      "Watch the character total with spaces and without spaces; editors use different ones.",
      "Compare against a preset limit such as a 60-character page title or a 155-character meta description.",
      "Check the UTF-8 byte figure when a system measures bytes rather than characters, such as an SMS or a database column.",
    ],
    faqs: [
      {
        q: "Why do characters with and without spaces differ so much?",
        a: "Spaces are characters. A 280-character social post with 45 spaces is 235 characters of visible text, and some tools report the smaller number.",
      },
      {
        q: "Do emoji count as one character?",
        a: "Not always. An emoji outside the basic multilingual plane is a single character but two UTF-16 code units, and the byte count will be higher still. Both figures are shown so you can tell which limit you are up against.",
      },
    ],
    limits: [
      "Characters are counted as Unicode code points, so an emoji with a skin-tone modifier or a flag counts as several, not one.",
      "Grapheme counting (what a reader perceives as a single character) is not offered.",
      "The preset limits are the platforms' published figures and can change without notice.",
    ],
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    category: "text",
    tagline: "Sentence case, title case, camelCase and more",
    description:
      "Convert text to UPPER, lower, Sentence, Title, camelCase, PascalCase, snake_case and kebab-case in one click, with Unicode-aware word splitting.",
    icon: FaArrowDownAZ,
    keywords: ["case converter", "title case", "uppercase converter", "camelcase", "snake case"],
    local: true,
    status: "live",
    rank: 82,
    added: "2026-08-06",
    howTo: [
      "Paste the text you want to convert.",
      "Pick a case from the buttons. The result appears beside your input.",
      "Use Title Case for headings, sentence case for UI labels, and snake or kebab case for identifiers.",
      "Copy the result. Your original text stays untouched so you can try another option.",
    ],
    faqs: [
      {
        q: "What is the difference between Title Case and sentence case?",
        a: "Title Case capitalises the significant words in a heading and leaves short articles and prepositions lowercase. Sentence case capitalises only the first letter of each sentence.",
      },
      {
        q: "Does it preserve accented letters and non-Latin scripts?",
        a: "Yes. Conversion uses Unicode-aware casing, so accented Latin letters, Greek and Cyrillic change case correctly, and scripts without letter case such as Chinese are left alone.",
      },
    ],
    limits: [
      "Scripts with no letter case (Chinese, Japanese, Thai) are unaffected by the cased conversions.",
      "camelCase and snake_case drop punctuation instead of escaping it, so they are for identifiers, not prose.",
      "Title case applies an English small-word list to decide which words stay lowercase.",
    ],
  },
  {
    slug: "remove-duplicate-lines",
    name: "Remove Duplicate Lines",
    category: "text",
    tagline: "Deduplicate, sort and trim a list",
    description:
      "Paste a list and remove duplicate lines, with options for case-insensitive matching, trimming whitespace, sorting and dropping blank lines.",
    icon: FaListCheck,
    keywords: ["remove duplicate lines", "deduplicate list", "unique lines", "dedupe text online"],
    local: true,
    status: "live",
    rank: 74,
    added: "2026-08-11",
    howTo: [
      "Paste your list, one item per line.",
      "Choose whether matching should ignore case and whether to trim surrounding spaces.",
      "Turn on sorting if you want alphabetical output, or leave it off to keep first-seen order.",
      "Read the summary to see how many lines were removed, then copy the cleaned list.",
    ],
    faqs: [
      {
        q: "Which duplicate is kept?",
        a: "The first occurrence is kept and later ones are dropped, so your original ordering survives unless you enable sorting.",
      },
      {
        q: "Are blank lines duplicates?",
        a: "Only if you ask them to be. Blank-line removal is a separate switch, so you can keep intentional paragraph breaks.",
      },
    ],
  },
  {
    slug: "lorem-ipsum-generator",
    name: "Lorem Ipsum Generator",
    category: "text",
    tagline: "Placeholder paragraphs, sentences or words",
    description:
      "Generate classic lorem ipsum placeholder text by paragraph, sentence or word count, with an option to start with the traditional opening line.",
    icon: FaParagraph,
    keywords: ["lorem ipsum", "placeholder text", "dummy text generator", "filler text"],
    local: true,
    status: "live",
    rank: 70,
    added: "2026-08-11",
    howTo: [
      "Choose whether you want paragraphs, sentences or words.",
      "Set the quantity you need for the layout you are filling.",
      "Copy the generated text into your design or document.",
    ],
    faqs: [
      {
        q: "Why use lorem ipsum rather than real copy?",
        a: "Readers stop evaluating layout and start reading the words. Placeholder text keeps attention on spacing, hierarchy and line length while a design is still moving.",
      },
      {
        q: "Is the output random every time?",
        a: "Yes. The generator draws from the standard lorem ipsum vocabulary, so repeated runs differ while the look of the text stays consistent.",
      },
    ],
  },
  {
    slug: "text-compare",
    name: "Text Compare",
    category: "text",
    tagline: "See exactly what changed between two drafts",
    description:
      "Compare two blocks of text and get a line-by-line and word-level diff showing what was added, removed and left unchanged.",
    icon: FaCodeCompare,
    keywords: ["text compare", "diff checker", "compare two texts", "find differences"],
    local: true,
    status: "live",
    rank: 72,
    added: "2026-08-14",
    howTo: [
      "Paste the original text into the left box and the revised text into the right box.",
      "Read the diff: removed lines are marked, added lines are marked, and unchanged lines are left plain.",
      "Switch to word-level view when a single line changed in several places and you want to see precisely where.",
      "Turn on ignore letter case when capitalisation alone should not count as a difference.",
    ],
    faqs: [
      {
        q: "Does it handle large documents?",
        a: "Comparison runs on a line-by-line basis first, which keeps it fast for tens of thousands of lines. Very large inputs are compared without blocking the interface.",
      },
      {
        q: "Can it ignore case differences?",
        a: "Yes. Enable case-insensitive matching and lines that differ only in capitalisation are reported as unchanged.",
      },
    ],
    limits: [
      "Past roughly four million line pairings the comparison stops pinpointing individual edits and marks the whole block as changed, rather than freezing the tab.",
      "Comparison is line-based, so moving a line reports it as a removal plus an addition rather than a move.",
      "Whitespace differences are visible but not separately ignorable.",
    ],
  },
  {
    slug: "url-encoder-decoder",
    name: "URL Encoder / Decoder",
    category: "text",
    tagline: "Percent-encode and decode URL components",
    description:
      "Percent-encode text for use in a URL query string or decode an encoded URL back to readable text, with full Unicode support.",
    icon: FaLink,
    keywords: ["url encoder", "percent encoding", "url decode", "encodeuriComponent online"],
    local: true,
    status: "live",
    rank: 76,
    added: "2026-08-14",
    howTo: [
      "Paste the text or URL you want to convert.",
      "Choose Encode to escape it for a URL, or Decode to turn percent escapes back into characters.",
      "Pick component mode for a single query value, or full-URL mode when you are handling a whole address.",
      "Copy the result.",
    ],
    faqs: [
      {
        q: "What is the difference between component and full-URL encoding?",
        a: "Component encoding escapes every reserved character, which is correct for a single query-string value. Full-URL encoding leaves the structural characters such as :, / and ? intact so the address still parses.",
      },
      {
        q: "Why did decoding fail with an error?",
        a: "A percent escape must be a % sign followed by two hexadecimal digits. A stray % in ordinary text is the usual cause, and the tool reports the position rather than producing a mangled result.",
      },
    ],
  },
];
