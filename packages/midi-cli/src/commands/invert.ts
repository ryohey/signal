import { readNoteStream, writeNoteStream } from "../io.js"

export interface InvertOptions {
  axis?: string // MIDI note number to mirror around
}

export async function invertCommand(options: InvertOptions): Promise<void> {
  const stream = await readNoteStream()

  let axis: number

  if (options.axis) {
    axis = parseInt(options.axis, 10)
    if (Number.isNaN(axis)) {
      throw new Error(`Invalid axis value: "${options.axis}"`)
    }
  } else {
    // Default: use the midpoint of the note range
    if (stream.notes.length === 0) {
      writeNoteStream(stream)
      return
    }
    const min = Math.min(...stream.notes.map((n) => n.noteNumber))
    const max = Math.max(...stream.notes.map((n) => n.noteNumber))
    axis = Math.round((min + max) / 2)
  }

  const notes = stream.notes.map((note) => ({
    ...note,
    noteNumber: Math.max(0, Math.min(127, 2 * axis - note.noteNumber)),
  }))

  writeNoteStream({ context: stream.context, notes })
}
