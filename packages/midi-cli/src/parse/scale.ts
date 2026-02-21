import { Scale } from "../theory/Scale.js"

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

/** Map of scale name aliases (lowercase, no hyphens) to Scale type */
const SCALE_ALIASES: Record<string, Scale> = {
  major: "major",
  minor: "minor",
  harmonicmajor: "harmonicMajor",
  harmonicminor: "harmonicMinor",
  melodicminor: "melodicMinor",
  ionian: "ionian",
  dorian: "dorian",
  phrygian: "phrygian",
  lydian: "lydian",
  mixolydian: "mixolydian",
  aeolian: "aeolian",
  locrian: "locrian",
  majorpentatonic: "majorPentatonic",
  minorpentatonic: "minorPentatonic",
  majorblues: "majorBlues",
  minorblues: "minorBlues",
  halfwholediminished: "halfWholeDiminished",
  wholehalddiminished: "wholeHalfDiminished",
  wholetone: "wholeTone",
}

export interface ParsedScale {
  key: number // pitch class 0-11
  scale: Scale
  intervals: number[] // the actual pitch classes in this key+scale
}

/**
 * Parse a scale string like "d-major", "c-minor", "eb-dorian" into
 * a key, scale type, and computed pitch class intervals.
 *
 * Also supports just a scale name like "major" (defaults to C).
 */
export function parseScale(input: string): ParsedScale {
  const s = input.trim().toLowerCase()

  // Try to split on the first hyphen: "eb-dorian" → ["eb", "dorian"]
  const hyphenIndex = s.indexOf("-")

  let keyStr: string
  let scaleStr: string

  if (hyphenIndex === -1) {
    // No hyphen — could be just a scale name (defaults to C)
    const scale = resolveScale(s)
    if (scale) {
      const intervals = Scale.getIntegerNotation(scale).map((i) => i % 12)
      return { key: 0, scale, intervals: [...intervals] }
    }
    throw new Error(
      `Invalid scale: "${input}". Expected format: <key>-<scale> (e.g., d-major, eb-dorian)`,
    )
  }

  keyStr = s.slice(0, hyphenIndex)
  scaleStr = s.slice(hyphenIndex + 1)

  const key = NOTE_MAP[keyStr]
  if (key === undefined) {
    throw new Error(
      `Invalid key: "${keyStr}". Expected: c, c#, db, d, d#, eb, e, f, f#, gb, g, g#, ab, a, a#, bb, b`,
    )
  }

  const scale = resolveScale(scaleStr)
  if (!scale) {
    throw new Error(
      `Invalid scale type: "${scaleStr}". Supported: ${Scale.values.join(", ")}`,
    )
  }

  const baseIntervals = Scale.getIntegerNotation(scale)
  const intervals = baseIntervals.map((i) => (i + key) % 12)

  return { key, scale, intervals: [...intervals] }
}

function resolveScale(name: string): Scale | null {
  // Direct match against Scale.values
  const direct = Scale.values.find((v) => v.toLowerCase() === name)
  if (direct) return direct

  // Try alias lookup (strips hyphens)
  const normalized = name.replace(/-/g, "")
  return SCALE_ALIASES[normalized] ?? null
}
