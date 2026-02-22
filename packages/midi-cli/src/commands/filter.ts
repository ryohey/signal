import { readNoteStream, writeNoteStream } from "../io.js"
import { parseNoteRange, parseVelocityRange } from "../parse/noteRange.js"
import { parsePosition } from "../parse/position.js"
import type { SerializedNote } from "../types.js"

export interface FilterOptions {
  pitch?: string
  velocity?: string
  from?: string
  to?: string
  invert?: boolean
  nth?: string
  random?: string
  channel?: string
}

export async function filterCommand(options: FilterOptions): Promise<void> {
  const stream = await readNoteStream()
  const { context } = stream

  const predicates: ((n: SerializedNote) => boolean)[] = []

  let fromTick: number | undefined
  let toTick: number | undefined

  if (options.from) {
    fromTick = parsePosition(options.from, context.timebase, context.measures)
    const ft = fromTick
    predicates.push((n) => n.tick >= ft)
  }

  if (options.to) {
    toTick = parsePosition(options.to, context.timebase, context.measures)
    const tt = toTick
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

  if (options.channel) {
    const ch = parseInt(options.channel, 10)
    predicates.push((n) => n.channel === ch)
  }

  const match = (n: SerializedNote) => predicates.every((p) => p(n))

  let notes: SerializedNote[]

  if (options.nth) {
    const nth = parseInt(options.nth, 10)
    let count = 0
    notes = stream.notes.filter((n) => {
      if (match(n)) {
        count++
        return options.invert ? count % nth !== 0 : count % nth === 0
      }
      return !!options.invert
    })
  } else if (options.random) {
    const pct = parseFloat(options.random)
    notes = stream.notes.filter((n) => {
      if (match(n)) {
        const keep = Math.random() * 100 < pct
        return options.invert ? !keep : keep
      }
      return !!options.invert
    })
  } else {
    notes = options.invert
      ? stream.notes.filter((n) => !match(n))
      : stream.notes.filter(match)
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
