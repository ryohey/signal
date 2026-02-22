import { Chord, type ChordType } from "./Chord.js"

export interface DetectedChord {
  root: number // pitch class 0-11
  type: ChordType
  inversion: number // 0 = root position, 1 = first inversion, etc.
  score: number // match quality (higher = better)
}

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
]

/**
 * Detect possible chords from a set of pitch classes (0-11).
 * Returns candidates sorted by score (best first).
 */
export function detectChord(pitchClasses: number[]): DetectedChord[] {
  if (pitchClasses.length < 2) return []

  const unique = [...new Set(pitchClasses.map((p) => ((p % 12) + 12) % 12))]
  unique.sort((a, b) => a - b)

  const candidates: DetectedChord[] = []

  for (const type of Chord.values) {
    const intervals = Chord.getIntervals(type)
    const chordSize = intervals.length

    // Try every possible root (0-11)
    for (let root = 0; root < 12; root++) {
      const chordPCs = intervals.map((i) => (root + i) % 12)

      // Check how many input pitch classes match chord tones
      const matchCount = unique.filter((p) => chordPCs.includes(p)).length
      const extraNotes = unique.filter((p) => !chordPCs.includes(p)).length
      const missingNotes = chordPCs.filter((p) => !unique.includes(p)).length

      // Require at least all chord tones present (or all input notes are chord tones)
      if (matchCount < Math.min(chordSize, unique.length)) continue
      if (extraNotes > 0) continue // no extra notes allowed for clean detection

      // Determine inversion based on lowest pitch class
      const bass = unique[0]
      let inversion = 0
      if (bass !== root) {
        const idx = chordPCs.indexOf(bass)
        if (idx > 0) inversion = idx
      }

      // Score: prefer exact matches, fewer missing notes, root position
      let score = 100
      score -= missingNotes * 20
      score -= inversion * 5
      // Prefer triads over extended chords for simple input
      if (unique.length <= 3 && chordSize > 4) score -= 10
      // Prefer simpler chord types
      if (chordSize === unique.length) score += 10

      candidates.push({ root, type, inversion, score })
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  return candidates
}

/**
 * Format a detected chord as a human-readable string.
 * E.g., { root: 0, type: "maj7", inversion: 0 } → "Cmaj7"
 */
export function formatChord(chord: DetectedChord): string {
  const rootName = NOTE_NAMES[chord.root]
  const suffix = chord.type === "maj" ? "" : chord.type
  const inv = chord.inversion > 0 ? ` (inv ${chord.inversion})` : ""
  return `${rootName}${suffix}${inv}`
}

/**
 * Get the best chord match for a set of pitch classes, or null if none found.
 */
export function detectBestChord(pitchClasses: number[]): DetectedChord | null {
  const candidates = detectChord(pitchClasses)
  return candidates.length > 0 ? candidates[0] : null
}
