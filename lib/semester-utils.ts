/**
 * Semester Utility Functions
 * 
 * Standardized on string values: "Ganjil" | "Genap"
 * These helpers safely convert from integer (1, 2) or mixed-case strings.
 * 
 * Used across: API routes, PDF generation, frontend pages
 */

export type SemesterValue = 'Ganjil' | 'Genap';

/**
 * Normalize any semester representation to the canonical string form.
 * Handles: 1, 2, "Ganjil", "Genap", "ganjil", "genap", etc.
 */
export function normalizeSemester(semester: number | string): SemesterValue {
  if (semester === 2 || String(semester).toLowerCase() === 'genap') return 'Genap';
  return 'Ganjil';
}

/**
 * Convert semester to integer (1 or 2).
 * Useful for numeric comparisons or legacy code.
 */
export function semesterToNumber(semester: number | string): 1 | 2 {
  if (semester === 2 || String(semester).toLowerCase() === 'genap') return 2;
  return 1;
}

/**
 * Get the display label for a semester value.
 * Alias for normalizeSemester — returns "Ganjil" or "Genap".
 */
export function semesterLabel(semester: number | string): string {
  return normalizeSemester(semester);
}

/** Check if semester is Ganjil (odd / semester 1) */
export function isGanjil(semester: number | string): boolean {
  return normalizeSemester(semester) === 'Ganjil';
}

/** Check if semester is Genap (even / semester 2) */
export function isGenap(semester: number | string): boolean {
  return normalizeSemester(semester) === 'Genap';
}

/**
 * Get the previous semester label.
 * Ganjil → Genap (previous academic year)
 * Genap → Ganjil (same academic year)
 */
export function previousSemester(semester: number | string): SemesterValue {
  return isGanjil(semester) ? 'Genap' : 'Ganjil';
}

/** Kepribadian / Personality grade options for students */
export const KEPRIBADIAN_OPTIONS = ['Sangat Baik', 'Baik', 'Cukup', 'Kurang'] as const;
export type KepribadianValue = (typeof KEPRIBADIAN_OPTIONS)[number];
