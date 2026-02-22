import { readNoteStream, writeNoteStream } from "../io.js"
import { parseGrid } from "../parse/grid.js"
import type { SerializedNote } from "../types.js"

export interface ThinOptions {
  maxDensity?: string
  per?: string
}

export async function thinCommand(
  percent: string | undefined,
  options: ThinOptions,
): Promise<void> {
  const stream = await readNoteStream()
  const { context } = stream

  let notes: SerializedNote[]

  if (options.maxDensity && options.per) {
    // Density-based thinning: max N notes per grid unit
    const maxNotes = parseInt(options.maxDensity, 10)
    const gridTicks = parseGrid(options.per, context.timebase)

    // Group notes by grid bucket
    const buckets = new Map<number, SerializedNote[]>()
    for (const note of stream.notes) {
      const bucket = Math.floor(note.tick / gridTicks)
      const existing = buckets.get(bucket)
      if (existing) {
        existing.push(note)
      } else {
        buckets.set(bucket, [note])
      }
    }

    notes = []
    for (const [, bucketNotes] of buckets) {
      if (bucketNotes.length <= maxNotes) {
        notes.push(...bucketNotes)
      } else {
        // Keep first N notes by tick order
        bucketNotes.sort((a, b) => a.tick - b.tick)
        notes.push(...bucketNotes.slice(0, maxNotes))
      }
    }
    notes.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)
  } else {
    // Random percentage thinning
    const pct = percent ? parseInt(percent, 10) : 50
    notes = stream.notes.filter(() => Math.random() * 100 < pct)
  }

  writeNoteStream({ context, notes })
}
