import { readNoteStream, writeNoteStream } from "../io.js"
import { parseScale } from "../parse/scale.js"
import { detectBestChord, formatChord } from "../theory/chordDetection.js"
import { Scale } from "../theory/Scale.js"
import type { SerializedNote } from "../types.js"

export interface AnalyzeOptions {
  key?: string
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

const DEGREE_NAMES = ["I", "II", "III", "IV", "V", "VI", "VII"]

export async function analyzeCommand(options: AnalyzeOptions): Promise<void> {
  const stream = await readNoteStream()

  // Group notes by tick position
  const groups = new Map<number, SerializedNote[]>()
  for (const note of stream.notes) {
    const existing = groups.get(note.tick)
    if (existing) {
      existing.push(note)
    } else {
      groups.set(note.tick, [note])
    }
  }

  // Parse key if provided
  let keyInfo:
    | { key: number; scale: (typeof Scale.values)[number]; intervals: number[] }
    | undefined
  if (options.key) {
    keyInfo = parseScale(options.key)
  }

  const sortedTicks = [...groups.keys()].sort((a, b) => a - b)
  const results: string[] = []

  for (const tick of sortedTicks) {
    const noteGroup = groups.get(tick)
    if (!noteGroup) continue
    if (noteGroup.length < 2) {
      const noteName = NOTE_NAMES[noteGroup[0].noteNumber % 12]
      const octave = Math.floor(noteGroup[0].noteNumber / 12) - 1
      results.push(`t${tick}: ${noteName}${octave}`)
      continue
    }

    const pitchClasses = [...new Set(noteGroup.map((n) => n.noteNumber % 12))]

    const chord = detectBestChord(pitchClasses)
    if (chord) {
      let label = formatChord(chord)

      // Add Roman numeral analysis if key is provided
      if (keyInfo) {
        const scaleIntervals = keyInfo.intervals
        const degreeIndex = scaleIntervals.indexOf(
          (chord.root - keyInfo.key + 12) % 12,
        )
        if (degreeIndex >= 0) {
          const degreeName = DEGREE_NAMES[degreeIndex]
          label += ` (${degreeName})`
        }
      }

      results.push(`t${tick}: ${label}`)
    } else {
      const noteNames = pitchClasses.map((pc) => NOTE_NAMES[pc]).join(", ")
      results.push(`t${tick}: [${noteNames}]`)
    }
  }

  // Output analysis to stderr, pass notes through on stdout
  process.stderr.write(results.join("\n") + "\n")
  writeNoteStream(stream)
}
