/**
 * Lightweight song state serializer for agent context.
 * Produces a compact JSON representation that lets the agent
 * understand the current song structure without full MIDI data.
 */

import type { Song } from "@signal-app/core"
import { isNoteEvent, isTimeSignatureEvent } from "@signal-app/core"
import { getInstrumentName } from "../../agent/instrumentMapping"

export interface TrackSummary {
  id: number
  name: string | undefined
  channel: number | undefined
  programNumber: number | undefined
  instrumentName: string | undefined
  isDrums: boolean
  isConductor: boolean
  noteCount: number
}

export interface SongState {
  trackCount: number
  tempo: number
  timeSignature: { numerator: number; denominator: number }
  timebase: number
  tracks: TrackSummary[]
}

/**
 * Serialize the current song state into a compact format for the agent.
 */
export function serializeSongState(song: Song): SongState {
  const conductorTrack = song.conductorTrack

  // Get tempo from conductor track (default 120 BPM)
  let tempo = 120
  if (conductorTrack) {
    const tempoAtStart = conductorTrack.getTempo(0)
    if (tempoAtStart !== undefined) {
      tempo = tempoAtStart
    }
  }

  // Get time signature from conductor track (default 4/4)
  let timeSignature = { numerator: 4, denominator: 4 }
  if (conductorTrack) {
    const tsEvent = conductorTrack.getTimeSignatureEvent(0)
    if (tsEvent) {
      timeSignature = {
        numerator: tsEvent.numerator,
        denominator: tsEvent.denominator,
      }
    }
  }

  // Summarize each track
  const tracks: TrackSummary[] = song.tracks.map((track, index) => {
    const noteCount = track.events.filter(isNoteEvent).length
    const programNumber = track.programNumber
    const instrumentName =
      programNumber !== undefined ? getInstrumentName(programNumber) : undefined

    return {
      id: index,
      name: track.name,
      channel: track.channel,
      programNumber,
      instrumentName,
      isDrums: track.isRhythmTrack,
      isConductor: track.isConductorTrack,
      noteCount,
    }
  })

  return {
    trackCount: song.tracks.length,
    tempo,
    timeSignature,
    timebase: song.timebase,
    tracks,
  }
}

/**
 * Format song state as a human-readable string for the agent prompt.
 */
export function formatSongStateForPrompt(state: SongState): string {
  const lines: string[] = []

  lines.push(`Current song state:`)
  lines.push(`- Tempo: ${state.tempo} BPM`)
  lines.push(
    `- Time signature: ${state.timeSignature.numerator}/${state.timeSignature.denominator}`,
  )
  lines.push(`- Timebase: ${state.timebase} ticks per quarter note`)
  lines.push(`- Tracks: ${state.trackCount}`)

  if (state.tracks.length > 0) {
    lines.push(``)
    lines.push(`Track details:`)
    for (const track of state.tracks) {
      if (track.isConductor) {
        lines.push(`  [${track.id}] Conductor track (tempo/time signature)`)
      } else {
        const instrument = track.instrumentName ?? track.name ?? "Unknown"
        const drums = track.isDrums ? " (drums)" : ""
        lines.push(
          `  [${track.id}] ${instrument}${drums} - channel ${track.channel}, ${track.noteCount} notes`,
        )
      }
    }
  }

  return lines.join("\n")
}
