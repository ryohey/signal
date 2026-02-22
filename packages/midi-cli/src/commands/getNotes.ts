import { readNoteStream, writeNoteStream } from "../io.js"
import { parseNoteRange, parseVelocityRange } from "../parse/noteRange.js"
import { parsePosition } from "../parse/position.js"

export interface GetNotesOptions {
  from?: string
  to?: string
  pitch?: string
  velocity?: string
  nth?: string
  random?: string
  channel?: string
}

export async function getNotesCommand(options: GetNotesOptions): Promise<void> {
  const stream = await readNoteStream()
  const { context } = stream
  let notes = stream.notes

  let fromTick: number | undefined
  let toTick: number | undefined

  if (options.from) {
    fromTick = parsePosition(options.from, context.timebase, context.measures)
    const ft = fromTick
    notes = notes.filter((n) => n.tick >= ft)
  }

  if (options.to) {
    toTick = parsePosition(options.to, context.timebase, context.measures)
    const tt = toTick
    notes = notes.filter((n) => n.tick < tt)
  }

  if (options.pitch) {
    const { min, max } = parseNoteRange(options.pitch)
    notes = notes.filter((n) => n.noteNumber >= min && n.noteNumber <= max)
  }

  if (options.velocity) {
    const { min, max } = parseVelocityRange(options.velocity)
    notes = notes.filter((n) => n.velocity >= min && n.velocity <= max)
  }

  if (options.channel) {
    const ch = parseInt(options.channel, 10)
    notes = notes.filter((n) => n.channel === ch)
  }

  if (options.nth) {
    const nth = parseInt(options.nth, 10)
    notes = notes.filter((_, i) => (i + 1) % nth === 0)
  }

  if (options.random) {
    const pct = parseFloat(options.random)
    notes = notes.filter(() => Math.random() * 100 < pct)
  }

  // Propagate selection range so downstream set-notes knows which region to replace
  const selection =
    fromTick !== undefined || toTick !== undefined
      ? {
          fromTick: fromTick ?? 0,
          toTick: toTick ?? Number.POSITIVE_INFINITY,
        }
      : context.selection

  writeNoteStream({ context: { ...context, selection }, notes })
}
