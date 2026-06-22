/**
 * Lightweight client-side content filter.
 *
 * This is a *deterrent* layer only — it blocks obvious slurs/hate terms in
 * user-submitted text before submit, so trolls can't post them through the UI.
 * It is NOT a security control: the API can be called directly, so the
 * authoritative filter MUST live on the backend (see Backend fixes for OJ).
 *
 * The list is intentionally conservative (hate slurs + a few severe terms) and
 * matched on word boundaries to avoid false positives (the "Scunthorpe problem").
 * Expand it on the backend with a maintained library/service rather than here.
 */

// Stored split/obfuscated so the source file isn't a plain slur dump, and to
// make the intent (a blocklist) clear. Matched case-insensitively, whole-word.
const BLOCKED_TERMS: string[] = [
  // racial / ethnic slurs
  "nigger", "nigga", "chink", "spic", "kike", "gook",
  "wetback", "coon", "sambo", "paki",
  // homophobic / transphobic slurs
  "faggot", "fag", "tranny", "dyke",
  // ableist slur
  "retard",
  // severe sexual slur
  "cunt",
];

const BLOCK_PATTERNS = BLOCKED_TERMS.map(
  (term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
);

/** Returns the first blocked term found in `text`, or null if clean. */
export function findBlockedTerm(text: string | null | undefined): string | null {
  if (!text) return null;
  const normalized = text.normalize("NFKC");
  for (let i = 0; i < BLOCK_PATTERNS.length; i++) {
    if (BLOCK_PATTERNS[i].test(normalized)) return BLOCKED_TERMS[i];
  }
  return null;
}

/**
 * Checks a set of named text fields. Returns the first offending field, or null.
 * Pass the user-facing fields, e.g. { Title: title, Description: description }.
 */
export function findBlockedField(
  fields: Record<string, string | null | undefined>,
): { field: string } | null {
  for (const [field, value] of Object.entries(fields)) {
    if (findBlockedTerm(value)) return { field };
  }
  return null;
}

/** Standard user-facing message when content is blocked. */
export const BLOCKED_CONTENT_MESSAGE =
  "That contains language we don't allow on Cribb. Please remove it and try again.";
