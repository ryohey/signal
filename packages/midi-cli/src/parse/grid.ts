/**
 * Parse a rhythmic grid value string into a tick duration.
 *
 * Supported formats:
 *   1/4    → quarter note
 *   1/8    → eighth note
 *   1/16   → sixteenth note
 *   1/32   → thirty-second note
 *   1/4t   → quarter note triplet
 *   1/8t   → eighth note triplet
 *   1/16t  → sixteenth note triplet
 *   1       → whole note
 *   <number> → raw tick value if it's just a plain integer
 */
export function parseGrid(input: string, timebase: number): number {
  const s = input.trim().toLowerCase()

  // Raw tick value
  if (/^\d+$/.test(s)) {
    return parseInt(s, 10)
  }

  // Triplet: 1/4t, 1/8t, etc.
  const tripletMatch = s.match(/^(\d+)\/(\d+)t$/)
  if (tripletMatch) {
    const numerator = parseInt(tripletMatch[1], 10)
    const denominator = parseInt(tripletMatch[2], 10)
    // A whole note = timebase * 4 ticks
    // 1/4 = timebase * 4 / 4 = timebase
    // Triplet = 2/3 of the normal value
    const normalTicks = (timebase * 4 * numerator) / denominator
    return Math.round((normalTicks * 2) / 3)
  }

  // Standard fraction: 1/4, 1/8, 3/16, etc.
  const fractionMatch = s.match(/^(\d+)\/(\d+)$/)
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10)
    const denominator = parseInt(fractionMatch[2], 10)
    return Math.round((timebase * 4 * numerator) / denominator)
  }

  // Dotted: 1/4., 1/8. (1.5x the normal value)
  const dottedMatch = s.match(/^(\d+)\/(\d+)\.$/)
  if (dottedMatch) {
    const numerator = parseInt(dottedMatch[1], 10)
    const denominator = parseInt(dottedMatch[2], 10)
    const normalTicks = (timebase * 4 * numerator) / denominator
    return Math.round(normalTicks * 1.5)
  }

  // Whole number of beats: "1" = whole note, "2" = double whole
  const wholeMatch = s.match(/^(\d+)$/)
  if (wholeMatch) {
    return parseInt(wholeMatch[1], 10) * timebase * 4
  }

  throw new Error(
    `Invalid grid value: "${input}". ` +
      `Expected: 1/4, 1/8, 1/16, 1/32, 1/4t (triplet), 1/8. (dotted), or a raw tick count`,
  )
}
