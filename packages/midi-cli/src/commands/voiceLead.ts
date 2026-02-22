import { readNoteStream, writeNoteStream } from "../io.js"
import type { SerializedNote } from "../types.js"

export interface VoiceLeadOptions {
  key: string
}

/**
 * Revoice chords for minimal voice movement between adjacent chord groups.
 * Groups notes by tick, then adjusts octaves of notes in each group
 * so they are as close as possible to the previous group.
 */
export async function voiceLeadCommand(
  _options: VoiceLeadOptions,
): Promise<void> {
  const stream = await readNoteStream()

  // Group notes by tick
  const groups = new Map<number, SerializedNote[]>()
  for (const note of stream.notes) {
    const existing = groups.get(note.tick)
    if (existing) {
      existing.push(note)
    } else {
      groups.set(note.tick, [note])
    }
  }

  const sortedTicks = [...groups.keys()].sort((a, b) => a - b)
  if (sortedTicks.length <= 1) {
    writeNoteStream(stream)
    return
  }

  const result: SerializedNote[] = []

  // Keep first chord as-is
  const firstGroup = groups.get(sortedTicks[0])
  if (!firstGroup) {
    writeNoteStream(stream)
    return
  }
  let prevPitches = firstGroup.map((n) => n.noteNumber).sort((a, b) => a - b)
  result.push(...firstGroup)

  for (let g = 1; g < sortedTicks.length; g++) {
    const tick = sortedTicks[g]
    const group = groups.get(tick)
    if (!group) continue

    // Sort by pitch
    group.sort((a, b) => a.noteNumber - b.noteNumber)

    const revoiced: SerializedNote[] = []
    for (const note of group) {
      const pc = note.noteNumber % 12
      // Find the closest octave placement to the average of previous pitches
      const prevAvg =
        prevPitches.length > 0
          ? prevPitches.reduce((s, p) => s + p, 0) / prevPitches.length
          : note.noteNumber

      let bestPitch = note.noteNumber
      let bestDist = Math.abs(note.noteNumber - prevAvg)

      // Try different octaves
      for (let oct = 1; oct <= 9; oct++) {
        const candidate = oct * 12 + pc
        if (candidate < 0 || candidate > 127) continue
        const dist = Math.abs(candidate - prevAvg)
        if (dist < bestDist) {
          bestDist = dist
          bestPitch = candidate
        }
      }

      revoiced.push({ ...note, noteNumber: bestPitch })
    }

    prevPitches = revoiced.map((n) => n.noteNumber).sort((a, b) => a - b)
    result.push(...revoiced)
  }

  // Add any non-grouped single notes that weren't in chord groups
  result.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)

  writeNoteStream({ context: stream.context, notes: result })
}
