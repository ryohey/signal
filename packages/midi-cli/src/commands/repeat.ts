import { readNoteStream, writeNoteStream } from "../io.js"
import { parseGrid } from "../parse/grid.js"
import type { SerializedNote } from "../types.js"

export interface RepeatOptions {
  gap?: string
}

export async function repeatCommand(
  count: string,
  options: RepeatOptions,
): Promise<void> {
  const stream = await readNoteStream()
  const { context } = stream
  const n = parseInt(count, 10)

  if (Number.isNaN(n) || n < 1) {
    throw new Error(`Invalid repeat count: "${count}". Must be >= 1`)
  }

  if (stream.notes.length === 0) {
    writeNoteStream(stream)
    return
  }

  // Find the total duration of the current notes
  const maxEnd = Math.max(
    ...stream.notes.map((note) => note.tick + note.duration),
  )
  const gapTicks = options.gap ? parseGrid(options.gap, context.timebase) : 0

  const allNotes: SerializedNote[] = []

  for (let i = 0; i < n; i++) {
    const offset = i * (maxEnd + gapTicks)
    for (const note of stream.notes) {
      allNotes.push({ ...note, tick: note.tick + offset })
    }
  }

  writeNoteStream({ context, notes: allNotes })
}
