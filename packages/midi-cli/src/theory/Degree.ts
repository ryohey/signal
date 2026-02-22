import type { ChordType } from "./Chord.js"
import { Scale } from "./Scale.js"

export interface DegreeInfo {
  root: number // pitch class 0-11
  chordType: ChordType
  degree: number // 1-7
}

/** Map of diatonic chord qualities for each scale degree in major */
const MAJOR_DEGREE_QUALITIES: ChordType[] = [
  "maj",
  "min",
  "min",
  "maj",
  "maj",
  "min",
  "dim",
]

/** Map of diatonic chord qualities for each scale degree in minor */
const MINOR_DEGREE_QUALITIES: ChordType[] = [
  "min",
  "dim",
  "maj",
  "min",
  "min",
  "maj",
  "maj",
]

/**
 * Parse a Roman numeral degree string and resolve it to a root pitch class
 * and chord type within the given key.
 *
 * Supports:
 *   I, ii, iii, IV, V, vi, vii  (diatonic, uppercase=major, lowercase=minor)
 *   bVII, #iv                    (chromatic alterations)
 *   Imaj7, V7, ii7              (with chord quality suffix)
 */
export function parseDegree(
  numeral: string,
  key: number,
  scale: Scale,
): DegreeInfo {
  const s = numeral.trim()

  // Extract accidental prefix
  let accidental = 0
  let rest = s
  if (rest.startsWith("b") || rest.startsWith("♭")) {
    accidental = -1
    rest = rest.slice(1)
  } else if (rest.startsWith("#") || rest.startsWith("♯")) {
    accidental = 1
    rest = rest.slice(1)
  }

  // Extract Roman numeral (try longer patterns first, case-sensitive)
  const romanMatch = rest.match(
    /^(VII|VII|vii|IV|iv|VI|vi|III|iii|II|ii|V|v|I|i)/,
  )
  if (!romanMatch) {
    throw new Error(`Invalid degree: "${numeral}"`)
  }

  const romanStr = romanMatch[0]
  rest = rest.slice(romanStr.length)

  // Check for diminished symbol
  let hasDimSymbol = false
  if (rest.startsWith("°") || rest.startsWith("o")) {
    hasDimSymbol = true
    rest = rest.slice(1)
  }

  const degree = romanToNumber(romanStr)
  const isUpperCase = romanStr[0] === romanStr[0].toUpperCase()

  // Get scale intervals
  const intervals = Scale.getIntegerNotation(scale)
  const degreeIndex = degree - 1

  if (degreeIndex < 0 || degreeIndex >= intervals.length) {
    throw new Error(`Degree ${degree} out of range for scale`)
  }

  // Root pitch class
  const root = (key + intervals[degreeIndex] + accidental + 12) % 12

  // Determine chord quality
  let chordType: ChordType

  if (rest) {
    // Explicit quality suffix (e.g., "maj7", "7", "m7b5")
    chordType = parseChordSuffix(rest)
  } else if (hasDimSymbol) {
    chordType = "dim"
  } else if (accidental !== 0) {
    // For chromatic alterations (bVII, #iv), use case to determine quality
    chordType = isUpperCase ? "maj" : "min"
  } else {
    // Use diatonic quality based on scale
    const isMinorScale =
      scale === "minor" ||
      scale === "aeolian" ||
      scale === "harmonicMinor" ||
      scale === "melodicMinor"
    const qualities = isMinorScale
      ? MINOR_DEGREE_QUALITIES
      : MAJOR_DEGREE_QUALITIES

    if (degreeIndex < qualities.length) {
      chordType = qualities[degreeIndex]
    } else {
      chordType = isUpperCase ? "maj" : "min"
    }
  }

  return { root, chordType, degree }
}

function romanToNumber(roman: string): number {
  const upper = roman.toUpperCase()
  const map: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
  }
  const result = map[upper]
  if (result === undefined) {
    throw new Error(`Invalid Roman numeral: "${roman}"`)
  }
  return result
}

function parseChordSuffix(suffix: string): ChordType {
  const s = suffix.toLowerCase()
  const map: Record<string, ChordType> = {
    maj7: "maj7",
    "7": "7",
    min7: "min7",
    m7: "min7",
    dim7: "dim7",
    m7b5: "m7b5",
    aug: "aug",
    aug7: "aug7",
    sus2: "sus2",
    sus4: "sus4",
    "9": "9",
    maj9: "maj9",
    min9: "min9",
    m9: "min9",
    "11": "11",
    "13": "13",
    "6": "6",
    min6: "min6",
    m6: "min6",
    add9: "add9",
    add11: "add11",
    "5": "5",
  }
  const result = map[s]
  if (!result) {
    throw new Error(`Unknown chord quality suffix: "${suffix}"`)
  }
  return result
}
