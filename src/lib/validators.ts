// ============================================================
// ResearchSetu – Validation Utilities
// ============================================================

/** Indian academic / research email domains */
const INDIAN_ACADEMIC_SUFFIXES = ['.ac.in', '.edu.in', '.res.in'] as const;

/**
 * Returns true if the email belongs to an Indian academic or research institution.
 * Triggers automatic `is_verified_researcher = true` badge on signup.
 */
export function isIndianAcademicEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return INDIAN_ACADEMIC_SUFFIXES.some((suffix) => domain.endsWith(suffix));
}

/**
 * Validates an ORCID iD in the format XXXX-XXXX-XXXX-XXXX
 * where the last character may be X (checksum).
 */
export function isValidOrcidId(orcid: string): boolean {
  return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid);
}

/**
 * Formats a raw ORCID string (digits only) into the XXXX-XXXX-XXXX-XXXX display format.
 */
export function formatOrcidId(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 16) return raw;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Returns the ORCID profile URL for a given iD.
 */
export function orcidProfileUrl(orcidId: string): string {
  return `https://orcid.org/${orcidId}`;
}

/**
 * Truncates a string to maxLength words and appends "…" if needed.
 */
export function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
}

/**
 * Counts words in a string (used for the 300-word post limit).
 */
export function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

