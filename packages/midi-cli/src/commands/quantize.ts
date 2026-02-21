import { readNoteStream, writeNoteStream } from "../io.js"
import { parseScale } from "../parse/scale.js"
import type { SerializedNote } from "../types.js"

export interface QuantizeOptions {
  scale: string
  direction?: string // "nearest" | "up" | "down"
}

export async function quantizeCommand(options: QuantizeOptions): Promise<void> {
  const stream = await readNoteStream()
  const { intervals } = parseScale(options.scale)
  const direction = (options.direction ?? "nearest") as
    | "nearest"
    | "up"
    | "down"

  const notes = stream.notes.map((note) =>
    quantizeNoteToScale(note, intervals, direction),
  )

  writeNoteStream({ context: stream.context, notes })
}

/**
 * Snap a note's pitch to the nearest note in the given scale.
 */
function quantizeNoteToScale(
  note: SerializedNote,
  intervals: number[],
  direction: "nearest" | "up" | "down",
): SerializedNote {
  const pitchClass = note.noteNumber % 12

  if (intervals.includes(pitchClass)) {
    return note // already in scale
  }

  // Find the nearest scale degree
  let bestOffset = 0
  let bestDistance = 13 // larger than any possible distance

  for (const interval of intervals) {
    // Distance going up
    const upDist = (interval - pitchClass + 12) % 12
    // Distance going down
    const downDist = (pitchClass - interval + 12) % 12

    if (direction === "up") {
      if (upDist < bestDistance) {
        bestDistance = upDist
        bestOffset = upDist
      }
    } else if (direction === "down") {
      if (downDist < bestDistance) {
        bestDistance = downDist
        bestOffset = -downDist
      }
    } else {
      // nearest
      if (upDist <= downDist && upDist < bestDistance) {
        bestDistance = upDist
        bestOffset = upDist
      } else if (downDist < upDist && downDist < bestDistance) {
        bestDistance = downDist
        bestOffset = -downDist
      }
    }
  }

  const newNoteNumber = Math.max(0, Math.min(127, note.noteNumber + bestOffset))
  return { ...note, noteNumber: newNoteNumber }
}
