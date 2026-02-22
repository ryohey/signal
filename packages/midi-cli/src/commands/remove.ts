import { readNoteStream, writeNoteStream } from "../io.js"
import { parseNoteRange, parseVelocityRange } from "../parse/noteRange.js"
import { parsePosition } from "../parse/position.js"
import type { SerializedNote } from "../types.js"

export interface RemoveOptions {
  from?: string
  to?: string
  pitch?: string
  velocity?: string
  nth?: string
}

export async function removeCommand(options: RemoveOptions): Promise<void> {
  const stream = await readNoteStream()
  const { context } = stream

  const predicates: ((n: SerializedNote) => boolean)[] = []

  if (options.from) {
    const ft = parsePosition(options.from, context.timebase, context.measures)
    predicates.push((n) => n.tick >= ft)
  }

  if (options.to) {
    const tt = parsePosition(options.to, context.timebase, context.measures)
    predicates.push((n) => n.tick < tt)
  }

  if (options.pitch) {
    const { min, max } = parseNoteRange(options.pitch)
    predicates.push((n) => n.noteNumber >= min && n.noteNumber <= max)
  }

  if (options.velocity) {
    const { min, max } = parseVelocityRange(options.velocity)
    predicates.push((n) => n.velocity >= min && n.velocity <= max)
  }

  const match = (n: SerializedNote) => predicates.every((p) => p(n))

  let notes: SerializedNote[]

  if (options.nth) {
    const nth = parseInt(options.nth, 10)
    let count = 0
    notes = stream.notes.filter((n) => {
      if (match(n)) {
        count++
        return count % nth !== 0
      }
      return true
    })
  } else {
    // Remove all matching notes (keep non-matching)
    notes = stream.notes.filter((n) => !match(n))
  }

  writeNoteStream({ context, notes })
}
