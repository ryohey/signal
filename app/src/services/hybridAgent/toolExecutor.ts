/**
 * Tool executor for the hybrid agent architecture.
 * Maps backend tool calls to MobX store operations.
 */

import type { Song } from "@signal-app/core"
import {
  emptyTrack,
  timeSignatureMidiEvent,
  toTrackEvents,
} from "@signal-app/core"
import {
  getInstrumentProgramNumber,
} from "../../agent/instrumentMapping"

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

export interface ToolResult {
  id: string
  result: string // JSON string
}

const DRUM_CHANNEL = 9
const MAX_MIDI_CHANNELS = 16

function getAvailableChannel(song: Song, isDrums: boolean): number {
  if (isDrums) {
    return DRUM_CHANNEL
  }

  const usedChannels = new Set<number>()
  for (const track of song.tracks) {
    if (track.channel !== undefined) {
      usedChannels.add(track.channel)
    }
  }

  for (let ch = 0; ch < MAX_MIDI_CHANNELS; ch++) {
    if (ch === DRUM_CHANNEL) continue
    if (!usedChannels.has(ch)) {
      return ch
    }
  }

  return 0
}

/**
 * Execute a single tool call against the song store.
 */
function executeToolCall(song: Song, toolCall: ToolCall): string {
  const { name, args } = toolCall
  console.log(`[HybridAgent] Executing tool: ${name}`, args)

  switch (name) {
    case "createTrack": {
      const instrumentName = args.instrumentName as string
      const trackName = args.trackName as string | undefined

      const instrumentInfo = getInstrumentProgramNumber(instrumentName)
      if (!instrumentInfo) {
        console.error(`[HybridAgent] Unknown instrument: ${instrumentName}`)
        return JSON.stringify({
          error: `Unknown instrument: "${instrumentName}"`,
        })
      }

      const channel = getAvailableChannel(song, instrumentInfo.isDrums)
      const track = emptyTrack(channel)
      track.setName(trackName ?? instrumentInfo.instrumentName)

      if (!instrumentInfo.isDrums) {
        track.setProgramNumber(instrumentInfo.programNumber)
      }

      console.log(`[HybridAgent] Adding track to song. Current tracks: ${song.tracks.length}`)
      song.addTrack(track)
      const trackId = song.tracks.indexOf(track)
      console.log(`[HybridAgent] Track added. New track count: ${song.tracks.length}, trackId: ${trackId}`)

      return JSON.stringify({
        trackId,
        instrumentName: instrumentInfo.instrumentName,
        programNumber: instrumentInfo.programNumber,
        channel,
        isDrums: instrumentInfo.isDrums,
      })
    }

    case "addNotes": {
      const trackId = args.trackId as number
      const notes = args.notes as Array<{
        pitch: number
        start: number
        duration: number
        velocity?: number
      }>

      const track = song.tracks[trackId]
      if (!track) {
        return JSON.stringify({
          error: `Track ${trackId} not found`,
        })
      }

      const noteEvents = notes.map((note) => ({
        type: "channel" as const,
        subtype: "note" as const,
        noteNumber: note.pitch,
        tick: note.start,
        duration: note.duration,
        velocity: note.velocity ?? 100,
      }))

      track.addEvents(noteEvents)

      return JSON.stringify({
        trackId,
        noteCount: notes.length,
      })
    }

    case "setTempo": {
      const bpm = args.bpm as number
      const tick = (args.tick as number) ?? 0

      const conductor = song.conductorTrack
      if (!conductor) {
        return JSON.stringify({
          error: "No conductor track found",
        })
      }

      conductor.setTempo(bpm, tick)

      return JSON.stringify({ bpm, tick })
    }

    case "setTimeSignature": {
      const numerator = args.numerator as number
      const denominator = args.denominator as number
      const tick = (args.tick as number) ?? 0

      const conductor = song.conductorTrack
      if (!conductor) {
        return JSON.stringify({
          error: "No conductor track found",
        })
      }

      const [tsEvent] = toTrackEvents([
        timeSignatureMidiEvent(0, numerator, denominator),
      ])

      conductor.addEvent({
        ...tsEvent,
        tick,
      })

      return JSON.stringify({ numerator, denominator, tick })
    }

    default:
      return JSON.stringify({
        error: `Unknown tool: ${name}`,
      })
  }
}

/**
 * Execute multiple tool calls and return results.
 */
export function executeToolCalls(
  song: Song,
  toolCalls: ToolCall[]
): ToolResult[] {
  return toolCalls.map((tc) => ({
    id: tc.id,
    result: executeToolCall(song, tc),
  }))
}
