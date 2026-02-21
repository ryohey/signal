import { readNoteStream, writeNoteStream } from "../io.js"
import { parseGrid } from "../parse/grid.js"

export interface QuantizeTimeOptions {
  grid: string
  strength?: string // 0-100, default 100
}

export async function quantizeTimeCommand(
  options: QuantizeTimeOptions,
): Promise<void> {
  const stream = await readNoteStream()
  const gridTicks = parseGrid(options.grid, stream.context.timebase)
  const strength = options.strength
    ? Math.max(0, Math.min(100, parseInt(options.strength, 10)))
    : 100
  const factor = strength / 100

  const notes = stream.notes.map((note) => {
    const quantized = Math.round(note.tick / gridTicks) * gridTicks
    const newTick = Math.round(note.tick + (quantized - note.tick) * factor)
    return { ...note, tick: Math.max(0, newTick) }
  })

  writeNoteStream({ context: stream.context, notes })
}
