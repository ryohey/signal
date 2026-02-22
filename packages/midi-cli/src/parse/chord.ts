import { Chord, type ChordType } from "../theory/Chord.js"

/** Map of note name (lowercase) to pitch class (0-11) */
const NOTE_MAP: Record<string, number> = {
  c: 0,
  "c#": 1,
  db: 1,
  d: 2,
  "d#": 3,
  eb: 3,
  e: 4,
  fb: 4,
  "e#": 5,
  f: 5,
  "f#": 6,
  gb: 6,
  g: 7,
  "g#": 8,
  ab: 8,
  a: 9,
  "a#": 10,
  bb: 10,
  b: 11,
  cb: 11,
}

export interface ParsedChord {
  root: number // pitch class 0-11
  type: ChordType
  intervals: number[] // semitone intervals from root
  bass?: number // pitch class for slash chord (e.g., C/E → bass=4)
}

/** Map of chord name suffixes to ChordType */
const CHORD_SUFFIX_MAP: [string, ChordType][] = [
  // Must try longer suffixes first
  ["minmaj7", "minmaj7"],
  ["mmaj7", "minmaj7"],
  ["min9", "min9"],
  ["m9", "min9"],
  ["min7", "min7"],
  ["m7b5", "m7b5"],
  ["m7", "min7"],
  ["min6", "min6"],
  ["m6", "min6"],
  ["min", "min"],
  ["m", "min"],
  ["maj9", "maj9"],
  ["maj7", "maj7"],
  ["maj", "maj"],
  ["aug7", "aug7"],
  ["aug", "aug"],
  ["dim7", "dim7"],
  ["dim", "dim"],
  ["sus2", "sus2"],
  ["sus4", "sus4"],
  ["add9", "add9"],
  ["add11", "add11"],
  ["13", "13"],
  ["11", "11"],
  ["9", "9"],
  ["7", "7"],
  ["6", "6"],
  ["5", "5"],
]

/**
 * Parse a chord symbol string into its components.
 *
 * Supported formats:
 *   C, Dm, Ebmaj7, F#sus4, Bb13, Gaug, Am7b5
 *   C/E (slash chord — C major with E bass)
 *
 * Note: This parses chord SYMBOLS (no octave). For note names with
 * octave (like "C4"), use parseNoteSpec instead.
 */
export function parseChord(input: string): ParsedChord {
  const s = input.trim()

  // Handle slash chords: C/E
  const slashIndex = s.indexOf("/")
  let mainPart = s
  let bass: number | undefined

  if (slashIndex > 0) {
    mainPart = s.slice(0, slashIndex)
    const bassStr = s.slice(slashIndex + 1).toLowerCase()
    bass = NOTE_MAP[bassStr]
    if (bass === undefined) {
      throw new Error(`Invalid bass note in slash chord: "${s}"`)
    }
  }

  // Extract root note
  const lower = mainPart.toLowerCase()
  let root: number | undefined
  let restStart = 1

  // Try two-char note name first (e.g., C#, Eb)
  if (mainPart.length >= 2) {
    const twoChar = lower.slice(0, 2)
    if (NOTE_MAP[twoChar] !== undefined) {
      root = NOTE_MAP[twoChar]
      restStart = 2
    }
  }

  // Fall back to single char
  if (root === undefined) {
    const oneChar = lower.slice(0, 1)
    if (NOTE_MAP[oneChar] !== undefined) {
      root = NOTE_MAP[oneChar]
      restStart = 1
    }
  }

  if (root === undefined) {
    throw new Error(`Invalid chord root: "${mainPart}"`)
  }

  // Extract chord type from suffix
  const suffix = mainPart.slice(restStart).toLowerCase()
  let chordType: ChordType = "maj" // default to major

  if (suffix.length > 0) {
    let found = false
    for (const [pattern, type] of CHORD_SUFFIX_MAP) {
      if (suffix === pattern) {
        chordType = type
        found = true
        break
      }
    }
    if (!found) {
      throw new Error(
        `Unknown chord type: "${suffix}" in "${input}". Supported: ${Chord.values.join(", ")}`,
      )
    }
  }

  const intervals = [...Chord.getIntervals(chordType)]

  return { root, type: chordType, intervals, bass }
}

/**
 * Check if a string looks like a chord symbol (vs a note name with octave).
 * Returns true for "C", "Dm", "Ebmaj7", etc.
 * Returns false for "C4", "60", "Eb5", etc.
 */
export function isChordSymbol(input: string): boolean {
  const s = input.trim()
  // If it ends with a digit preceded by nothing or a letter, it's likely a note+octave
  // e.g., C4, Eb5 — note names end with a digit that represents octave
  // But Cmaj7, Bb13 also end with digits — check if the last part is a known suffix
  try {
    parseChord(s)
    // If the string is JUST a root note letter(s) followed by a digit, it's ambiguous
    // e.g., "C4" could be "C major" (ignoring 4) or "C octave 4"
    // Use this heuristic: if it matches <letter(s)><single digit> exactly, treat as note
    if (/^[A-Ga-g][#b]?\d$/.test(s)) {
      return false
    }
    return true
  } catch {
    return false
  }
}
