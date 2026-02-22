import { readNoteStream, writeNoteStream } from "../io.js"

export interface CompressOptions {
  range?: string
  ratio?: string
}

export async function compressCommand(options: CompressOptions): Promise<void> {
  const stream = await readNoteStream()

  let notes = stream.notes

  if (options.range) {
    // Compress velocity to a range
    const parts = options.range.split("-")
    const min = parseInt(parts[0], 10)
    const max = parseInt(parts[1], 10)

    if (notes.length === 0) {
      writeNoteStream(stream)
      return
    }

    const currentMin = Math.min(...notes.map((n) => n.velocity))
    const currentMax = Math.max(...notes.map((n) => n.velocity))
    const currentRange = currentMax - currentMin || 1

    notes = notes.map((n) => {
      const normalized = (n.velocity - currentMin) / currentRange
      const newVel = Math.round(min + normalized * (max - min))
      return { ...n, velocity: Math.max(0, Math.min(127, newVel)) }
    })
  } else if (options.ratio) {
    // Compress toward mean velocity by ratio
    const ratio = parseFloat(options.ratio)
    const mean =
      notes.reduce((sum, n) => sum + n.velocity, 0) / (notes.length || 1)

    notes = notes.map((n) => {
      const diff = n.velocity - mean
      const compressed = mean + diff / ratio
      return {
        ...n,
        velocity: Math.max(0, Math.min(127, Math.round(compressed))),
      }
    })
  }

  writeNoteStream({ context: stream.context, notes })
}
