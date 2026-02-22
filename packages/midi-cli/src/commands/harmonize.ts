import { readNoteStream, writeNoteStream } from "../io.js"
import { parseScale } from "../parse/scale.js"
import type { SerializedNote } from "../types.js"

export interface HarmonizeOptions {
  interval: string
  key: string
  chord?: boolean
}

export async function harmonizeCommand(
  options: HarmonizeOptions,
): Promise<void> {
  const stream = await readNoteStream()
  const keyInfo = parseScale(options.key)
  const scaleIntervals = keyInfo.intervals

  // Build pitch class to scale degree map
  const pcToDegree = new Map<number, number>()
  for (let i = 0; i < scaleIntervals.length; i++) {
    pcToDegree.set((keyInfo.key + scaleIntervals[i]) % 12, i)
  }

  const intervalSteps = parseIntervalSteps(options.interval)
  const newNotes: SerializedNote[] = []

  for (const note of stream.notes) {
    const pc = note.noteNumber % 12
    const octave = Math.floor(note.noteNumber / 12)
    const degree = pcToDegree.get(pc)

    if (degree === undefined) {
      // Note is not in the scale, skip harmonization
      continue
    }

    if (options.chord) {
      // Add full diatonic triad (3rd and 5th)
      for (const step of [2, 4]) {
        const harmonyNote = getDiatonicNote(
          degree,
          step,
          octave,
          keyInfo.key,
          scaleIntervals,
        )
        if (harmonyNote >= 0 && harmonyNote <= 127) {
          newNotes.push({ ...note, noteNumber: harmonyNote })
        }
      }
    } else {
      const harmonyNote = getDiatonicNote(
        degree,
        intervalSteps,
        octave,
        keyInfo.key,
        scaleIntervals,
      )
      if (harmonyNote >= 0 && harmonyNote <= 127) {
        newNotes.push({ ...note, noteNumber: harmonyNote })
      }
    }
  }

  const allNotes = [...stream.notes, ...newNotes]
  allNotes.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)

  writeNoteStream({ context: stream.context, notes: allNotes })
}

function getDiatonicNote(
  degree: number,
  steps: number,
  baseOctave: number,
  key: number,
  scaleIntervals: number[],
): number {
  const targetDegree = degree + steps
  const scaleLen = scaleIntervals.length
  const octaveOffset = Math.floor(targetDegree / scaleLen)
  const wrappedDegree = ((targetDegree % scaleLen) + scaleLen) % scaleLen
  const pc = (key + scaleIntervals[wrappedDegree]) % 12
  return (baseOctave + octaveOffset) * 12 + pc
}

function parseIntervalSteps(interval: string): number {
  const s = interval.toLowerCase().trim()
  const map: Record<string, number> = {
    "2nd": 1,
    "3rd": 2,
    "4th": 3,
    "5th": 4,
    "6th": 5,
    "7th": 6,
    octave: 7,
  }
  const result = map[s]
  if (result === undefined) {
    const n = parseInt(s, 10)
    if (!Number.isNaN(n)) return n - 1 // "3" → 2 steps
    throw new Error(
      `Invalid interval: "${interval}". Use: 2nd, 3rd, 4th, 5th, 6th, 7th, octave`,
    )
  }
  return result
}
