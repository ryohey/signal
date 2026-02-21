import {
  isNoteEvent,
  isSetTempoEvent,
  isTimeSignatureEvent,
} from "@signal-app/core"
import { loadMidiFile } from "../io.js"

export function infoCommand(filePath: string): void {
  const song = loadMidiFile(filePath)

  const lines: string[] = []

  lines.push(`File: ${filePath}`)
  lines.push(`Name: ${song.name || "(untitled)"}`)
  lines.push(`Timebase: ${song.timebase} ticks/quarter`)
  lines.push(`Tracks: ${song.tracks.length}`)
  lines.push("")

  // Tempo info from conductor track
  const conductor = song.conductorTrack
  if (conductor) {
    const tempoEvents = conductor.events.filter(isSetTempoEvent)
    if (tempoEvents.length > 0) {
      const firstTempo = tempoEvents[0]
      const bpm = Math.round(60_000_000 / firstTempo.microsecondsPerBeat)
      lines.push(`Tempo: ${bpm} BPM`)
      if (tempoEvents.length > 1) {
        lines.push(`  (${tempoEvents.length} tempo changes)`)
      }
    }

    const timeSigEvents = conductor.events.filter(isTimeSignatureEvent)
    if (timeSigEvents.length > 0) {
      const first = timeSigEvents[0]
      lines.push(`Time Signature: ${first.numerator}/${first.denominator}`)
      if (timeSigEvents.length > 1) {
        lines.push(`  (${timeSigEvents.length} time signature changes)`)
      }
    }
  }

  lines.push("")
  lines.push("Tracks:")

  for (let i = 0; i < song.tracks.length; i++) {
    const track = song.tracks[i]
    const noteCount = track.events.filter(isNoteEvent).length
    const ch =
      track.channel !== undefined ? `ch ${track.channel + 1}` : "conductor"
    const name = track.name || "(unnamed)"
    lines.push(`  ${i + 1}. [${ch}] ${name} — ${noteCount} notes`)
  }

  process.stdout.write(lines.join("\n") + "\n")
}
