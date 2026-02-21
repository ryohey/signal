import { readNoteStream, writeNoteStream } from "../io.js"
import { parseNoteRange, parseVelocityRange } from "../parse/noteRange.js"
import { parsePosition } from "../parse/position.js"

export interface GetNotesOptions {
  from?: string
  to?: string
  pitch?: string
  velocity?: string
}

export async function getNotesCommand(options: GetNotesOptions): Promise<void> {
  const stream = await readNoteStream()
  const { context } = stream
  let notes = stream.notes

  if (options.from) {
    const fromTick = parsePosition(
      options.from,
      context.timebase,
      context.measures,
    )
    notes = notes.filter((n) => n.tick >= fromTick)
  }

  if (options.to) {
    const toTick = parsePosition(options.to, context.timebase, context.measures)
    notes = notes.filter((n) => n.tick < toTick)
  }

  if (options.pitch) {
    const { min, max } = parseNoteRange(options.pitch)
    notes = notes.filter((n) => n.noteNumber >= min && n.noteNumber <= max)
  }

  if (options.velocity) {
    const { min, max } = parseVelocityRange(options.velocity)
    notes = notes.filter((n) => n.velocity >= min && n.velocity <= max)
  }

  writeNoteStream({ context, notes })
}
