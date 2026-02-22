import { readNoteStream, writeNoteStream } from "../io.js"

export interface SpreadOptions {
  voices?: string
  channel?: string
}

export async function spreadCommand(options: SpreadOptions): Promise<void> {
  const stream = await readNoteStream()

  const numVoices = options.voices ? parseInt(options.voices, 10) : 2
  const channels = options.channel
    ? options.channel.split(",").map((c) => parseInt(c.trim(), 10))
    : Array.from({ length: numVoices }, (_, i) => i)

  // Group simultaneous notes by tick
  const groups = new Map<number, typeof stream.notes>()
  for (const note of stream.notes) {
    const existing = groups.get(note.tick)
    if (existing) {
      existing.push(note)
    } else {
      groups.set(note.tick, [note])
    }
  }

  const notes = []
  for (const [, noteGroup] of groups) {
    // Sort by pitch (lowest to highest)
    noteGroup.sort((a, b) => a.noteNumber - b.noteNumber)

    // Assign each note to a voice (round-robin by pitch position)
    for (let i = 0; i < noteGroup.length; i++) {
      const voiceIndex = Math.min(i, numVoices - 1)
      notes.push({
        ...noteGroup[i],
        channel: channels[voiceIndex % channels.length],
      })
    }
  }

  notes.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)
  writeNoteStream({ context: stream.context, notes })
}
