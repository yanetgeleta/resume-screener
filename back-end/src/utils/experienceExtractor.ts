/**
 * Extracts the highest total years of work experience found within a resume text chunk.
 * Returns a single unified number representing years (e.g., 5.5), or 0 if none is found.
 */
export function extractYearsFromChunk(text: string): number {
  if (!text) return 0;

  // 1. REGEX FOR EXPLICIT PHRASES: Matches "5+ years", "3 yrs", "7 years of experience"
  // Captures up to one decimal place (e.g., "2.5 years")
  const explicitRegex = /(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:year|yr)s?/gi;

  let match;
  let maxExplicitYears = 0;

  while ((match = explicitRegex.exec(text)) !== null) {
    const years = parseFloat(match[1]);
    if (years > maxExplicitYears) {
      maxExplicitYears = years;
    }
  }

  // If we found an explicit mention (like "5 years of experience"), prioritize it
  if (maxExplicitYears > 0) {
    return maxExplicitYears;
  }

  // 2. FALLBACK REGEX FOR DATE RANGES: Matches "2018 - 2022" or "2021 - Present"
  // Captures two distinct years within a traditional resume timeline gap
  const yearRangeRegex =
    /\b(19\d{2}|20\d{2})\s*[-–—]\s*(Present|(?:19\d{2}|20\d{2}))\b/gi;

  let totalCalculatedYears = 0;
  const currentYear = new Date().getFullYear(); // Dynamic baseline check (2026)

  while ((match = yearRangeRegex.exec(text)) !== null) {
    const startYear = parseInt(match[1], 10);
    const endStr = match[2];

    const endYear =
      endStr.toLowerCase() === "present" ? currentYear : parseInt(endStr, 10);

    if (endYear >= startYear) {
      totalCalculatedYears += endYear - startYear;
    }
  }

  // Safety check: Clamp realistic candidate age boundaries per individual chunk context
  return totalCalculatedYears > 0 ? Math.min(totalCalculatedYears, 40) : 0;
}
