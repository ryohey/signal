import { readNoteStream, writeNoteStream } from "../io.js"
import { parsePosition } from "../parse/position.js"

export interface SliceOptions {
  from?: string
  to?: string
  zero?: boolean
}

export async function sliceCommand(options: SliceOptions): Promise<void> {
  const stream = await readNoteStream()
  const { context } = stream

  let fromTick = 0
  let toTick = Number.POSITIVE_INFINITY

  if (options.from) {
    fromTick = parsePosition(options.from, context.timebase, context.measures)
  }

  if (options.to) {
    toTick = parsePosition(options.to, context.timebase, context.measures)
  }

  let notes = stream.notes.filter((n) => n.tick >= fromTick && n.tick < toTick)

  // Rebase to tick 0 if requested
  if (options.zero && notes.length > 0) {
    const offset = fromTick
    notes = notes.map((n) => ({ ...n, tick: n.tick - offset }))
  }

  const selection = { fromTick, toTick }
  writeNoteStream({ context: { ...context, selection }, notes })
}
