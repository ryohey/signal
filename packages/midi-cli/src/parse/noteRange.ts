/**
 * Parse a note range string into min/max MIDI note numbers.
 *
 * Supported formats:
 *   60-72        → numeric MIDI note range
 *   C4-C5        → note name range (C4=60, C5=72)
 *   C4           → single note (min=max)
 *   60           → single MIDI note number
 */
export function parseNoteRange(input: string): { min: number; max: number } {
  const s = input.trim()

  // Range with hyphen: need to handle note names that contain #
  // Try splitting on hyphen that separates two note specs
  const parts = splitRange(s)

  if (parts.length === 2) {
    const min = parseNoteSpec(parts[0])
    const max = parseNoteSpec(parts[1])
    return { min: Math.min(min, max), max: Math.max(min, max) }
  }

  // Single value
  const note = parseNoteSpec(s)
  return { min: note, max: note }
}

/**
 * Split a range string like "C4-C5" or "60-72" on the range separator.
 * Needs to handle note names with # (e.g., "C#4-D5").
 */
function splitRange(s: string): string[] {
  // Try to find a hyphen that separates two note specs
  // A hyphen after a digit or letter (not after #/b) that is followed by a letter or digit
  for (let i = 1; i < s.length; i++) {
    if (s[i] === "-" && i > 0) {
      const before = s[i - 1]
      // The hyphen is a separator if the char before it is a digit
      if (/\d/.test(before)) {
        return [s.slice(0, i), s.slice(i + 1)]
      }
    }
  }
  return [s]
}

const NOTE_NAMES: Record<string, number> = {
  c: 0,
  "c#": 1,
  db: 1,
  d: 2,
  "d#": 3,
  eb: 3,
  e: 4,
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
}

/**
 * Parse a single note spec: "C4", "C#3", "60", "Eb5"
 */
function parseNoteSpec(s: string): number {
  const trimmed = s.trim()

  // Pure number
  if (/^\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10)
    if (n < 0 || n > 127) {
      throw new Error(`MIDI note number out of range: ${n} (must be 0-127)`)
    }
    return n
  }

  // Note name + octave: C4, C#4, Eb5
  const match = trimmed.toLowerCase().match(/^([a-g][#b]?)(-?\d+)$/)
  if (match) {
    const noteName = match[1]
    const octave = parseInt(match[2], 10)
    const pitchClass = NOTE_NAMES[noteName]
    if (pitchClass === undefined) {
      throw new Error(`Invalid note name: "${noteName}"`)
    }
    // MIDI note: C4 = 60, so C-1 = 0
    const midiNote = (octave + 1) * 12 + pitchClass
    if (midiNote < 0 || midiNote > 127) {
      throw new Error(
        `Note "${trimmed}" is out of MIDI range (${midiNote}, must be 0-127)`,
      )
    }
    return midiNote
  }

  throw new Error(
    `Invalid note specification: "${trimmed}". Expected: MIDI number (0-127) or note name (C4, Eb5, etc.)`,
  )
}

/**
 * Parse a velocity range string into min/max values.
 *
 * Supported formats:
 *   0-64    → velocity range
 *   100     → single velocity value
 */
export function parseVelocityRange(input: string): {
  min: number
  max: number
} {
  const s = input.trim()
  const parts = s.split("-")

  if (parts.length === 2) {
    const min = parseInt(parts[0], 10)
    const max = parseInt(parts[1], 10)
    if (Number.isNaN(min) || Number.isNaN(max)) {
      throw new Error(`Invalid velocity range: "${input}"`)
    }
    return { min: Math.max(0, min), max: Math.min(127, max) }
  }

  const val = parseInt(s, 10)
  if (Number.isNaN(val)) {
    throw new Error(`Invalid velocity value: "${input}"`)
  }
  return { min: val, max: val }
}
