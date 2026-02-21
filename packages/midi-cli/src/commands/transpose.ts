import { readNoteStream, writeNoteStream } from "../io.js"

export async function transposeCommand(semitones: string): Promise<void> {
  const stream = await readNoteStream()
  const delta = parseInt(semitones, 10)

  if (Number.isNaN(delta)) {
    throw new Error(
      `Invalid semitone value: "${semitones}". Expected an integer.`,
    )
  }

  const notes = stream.notes.map((note) => ({
    ...note,
    noteNumber: Math.max(0, Math.min(127, note.noteNumber + delta)),
  }))

  writeNoteStream({ context: stream.context, notes })
}
