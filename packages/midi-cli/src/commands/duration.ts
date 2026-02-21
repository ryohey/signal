import { readNoteStream, writeNoteStream } from "../io.js"
import { parseGrid } from "../parse/grid.js"

export async function durationCommand(
  operation: string,
  value: string | undefined,
): Promise<void> {
  const stream = await readNoteStream()

  let notes = stream.notes

  switch (operation) {
    case "set": {
      if (!value)
        throw new Error("duration set requires a value (e.g., 1/8 or 240)")
      const ticks = parseGrid(value, stream.context.timebase)
      notes = notes.map((n) => ({ ...n, duration: ticks }))
      break
    }

    case "scale": {
      if (!value)
        throw new Error("duration scale requires a factor (e.g., 0.5, 2.0)")
      const factor = parseFloat(value)
      if (Number.isNaN(factor))
        throw new Error(`Invalid scale factor: "${value}"`)
      notes = notes.map((n) => ({
        ...n,
        duration: Math.max(1, Math.round(n.duration * factor)),
      }))
      break
    }

    case "legato": {
      // Sort by tick, then extend each note to reach the next
      const sorted = [...notes].sort((a, b) => a.tick - b.tick)
      notes = sorted.map((n, i) => {
        if (i < sorted.length - 1) {
          const gap = sorted[i + 1].tick - n.tick
          return { ...n, duration: Math.max(1, gap) }
        }
        return n
      })
      break
    }

    case "staccato": {
      const percentage = value ? parseFloat(value) : 50
      if (Number.isNaN(percentage))
        throw new Error(`Invalid staccato percentage: "${value}"`)
      const factor = percentage / 100
      notes = notes.map((n) => ({
        ...n,
        duration: Math.max(1, Math.round(n.duration * factor)),
      }))
      break
    }

    default:
      throw new Error(
        `Unknown duration operation: "${operation}". Expected: set, scale, legato, staccato`,
      )
  }

  writeNoteStream({ context: stream.context, notes })
}
