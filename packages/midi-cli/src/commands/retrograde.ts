import { readNoteStream, writeNoteStream } from "../io.js"

export async function retrogradeCommand(): Promise<void> {
  const stream = await readNoteStream()

  if (stream.notes.length <= 1) {
    writeNoteStream(stream)
    return
  }

  // Sort by tick to find boundaries
  const sorted = [...stream.notes].sort((a, b) => a.tick - b.tick)
  const firstTick = sorted[0].tick
  const lastTick = sorted[sorted.length - 1].tick

  // Reverse: mirror each note's tick position around the center
  // A note at firstTick goes to lastTick, and vice versa
  const notes = stream.notes.map((note) => ({
    ...note,
    tick: firstTick + (lastTick - note.tick),
  }))

  // Sort the result by tick for clean output
  notes.sort((a, b) => a.tick - b.tick)

  writeNoteStream({ context: stream.context, notes })
}
