/**
 * Tool executor for the hybrid agent architecture.
 * Maps backend tool calls to MobX store operations.
 */

import type { NoteEvent, Song, TrackId } from "@signal-app/core"
import {
  emptyTrack,
  isNoteEvent,
  timeSignatureMidiEvent,
  toTrackEvents,
} from "@signal-app/core"
import { getInstrumentProgramNumber } from "../../agent/instrumentMapping"

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

      console.log(
        `[HybridAgent] Adding track to song. Current tracks: ${song.tracks.length}`,
      )
      song.addTrack(track)
      const trackId = song.tracks.indexOf(track)
      console.log(
        `[HybridAgent] Track added. New track count: ${song.tracks.length}, trackId: ${trackId}`,
      )

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

    // ========================================================================
    // NOTE EDITING TOOLS
    // ========================================================================

    case "deleteNotes": {
      const trackId = args.trackId as number
      const noteIds = args.noteIds as number[]

      const track = song.tracks[trackId]
      if (!track) {
        return JSON.stringify({ error: `Track ${trackId} not found` })
      }

      track.removeEvents(noteIds)

      return JSON.stringify({
        trackId,
        deletedCount: noteIds.length,
      })
    }

    case "updateNotes": {
      const trackId = args.trackId as number
      const updates = args.updates as Array<{
        id: number
        pitch?: number
        tick?: number
        duration?: number
        velocity?: number
      }>

      const track = song.tracks[trackId]
      if (!track) {
        return JSON.stringify({ error: `Track ${trackId} not found` })
      }

      const updateEvents = updates.map((update) => ({
        id: update.id,
        ...(update.pitch !== undefined && { noteNumber: update.pitch }),
        ...(update.tick !== undefined && { tick: update.tick }),
        ...(update.duration !== undefined && { duration: update.duration }),
        ...(update.velocity !== undefined && { velocity: update.velocity }),
      }))

      track.updateEvents(updateEvents)

      return JSON.stringify({
        trackId,
        updatedCount: updates.length,
      })
    }

    case "transposeNotes": {
      const trackId = args.trackId as number
      const noteIds = args.noteIds as number[]
      const semitones = args.semitones as number

      const track = song.tracks[trackId]
      if (!track) {
        return JSON.stringify({ error: `Track ${trackId} not found` })
      }

      // Get notes and transpose them
      const updates = noteIds
        .map((id) => {
          const event = track.getEventById(id)
          if (!event || !isNoteEvent(event)) return null
          const newPitch = Math.max(0, Math.min(127, event.noteNumber + semitones))
          return { id, noteNumber: newPitch }
        })
        .filter((u): u is { id: number; noteNumber: number } => u !== null)

      track.updateEvents(updates)

      return JSON.stringify({
        trackId,
        transposedCount: updates.length,
        semitones,
      })
    }

    case "duplicateNotes": {
      const trackId = args.trackId as number
      const noteIds = args.noteIds as number[]
      const offsetTicks = (args.offsetTicks as number) ?? 0

      const track = song.tracks[trackId]
      if (!track) {
        return JSON.stringify({ error: `Track ${trackId} not found` })
      }

      // Get the notes to duplicate
      const notesToDuplicate = noteIds
        .map((id) => track.getEventById(id))
        .filter((e): e is NoteEvent => e !== undefined && isNoteEvent(e))

      if (notesToDuplicate.length === 0) {
        return JSON.stringify({
          trackId,
          duplicatedCount: 0,
          newNoteIds: [],
          actualOffset: 0,
        })
      }

      // Calculate offset - if 0, place immediately after the last note
      let actualOffset = offsetTicks
      if (actualOffset === 0) {
        const minTick = Math.min(...notesToDuplicate.map((n) => n.tick))
        const maxEnd = Math.max(...notesToDuplicate.map((n) => n.tick + n.duration))
        actualOffset = maxEnd - minTick
      }

      // Create duplicated notes
      const newNotes = notesToDuplicate.map((note) => ({
        type: "channel" as const,
        subtype: "note" as const,
        noteNumber: note.noteNumber,
        tick: note.tick + actualOffset,
        duration: note.duration,
        velocity: note.velocity,
      }))

      const addedEvents = track.addEvents(newNotes)

      return JSON.stringify({
        trackId,
        duplicatedCount: addedEvents.length,
        newNoteIds: addedEvents.map((e) => e.id),
        actualOffset,
      })
    }

    case "quantizeNotes": {
      const trackId = args.trackId as number
      const noteIds = args.noteIds as number[]
      const gridSize = args.gridSize as number

      const track = song.tracks[trackId]
      if (!track) {
        return JSON.stringify({ error: `Track ${trackId} not found` })
      }

      // Quantize function: round to nearest grid
      const quantize = (tick: number) => Math.round(tick / gridSize) * gridSize

      const updates = noteIds
        .map((id) => {
          const event = track.getEventById(id)
          if (!event || !isNoteEvent(event)) return null
          return { id, tick: quantize(event.tick) }
        })
        .filter((u): u is { id: number; tick: number } => u !== null)

      track.updateEvents(updates)

      return JSON.stringify({
        trackId,
        quantizedCount: updates.length,
      })
    }

    // ========================================================================
    // TRACK OPERATION TOOLS
    // ========================================================================

    case "deleteTrack": {
      const trackId = args.trackId as number

      const track = song.tracks[trackId]
      if (!track) {
        return JSON.stringify({ error: `Track ${trackId} not found` })
      }

      // Don't allow deleting conductor track
      if (track.isConductorTrack) {
        return JSON.stringify({ error: "Cannot delete conductor track" })
      }

      song.removeTrack(track.id as TrackId)

      return JSON.stringify({
        deletedTrackId: trackId,
        success: true,
      })
    }

    case "renameTrack": {
      const trackId = args.trackId as number
      const name = args.name as string

      const track = song.tracks[trackId]
      if (!track) {
        return JSON.stringify({ error: `Track ${trackId} not found` })
      }

      track.setName(name)

      return JSON.stringify({
        trackId,
        newName: name,
      })
    }

    case "setTrackInstrument": {
      const trackId = args.trackId as number
      const instrumentName = args.instrumentName as string

      const track = song.tracks[trackId]
      if (!track) {
        return JSON.stringify({ error: `Track ${trackId} not found` })
      }

      const instrumentInfo = getInstrumentProgramNumber(instrumentName)
      if (!instrumentInfo) {
        return JSON.stringify({ error: `Unknown instrument: "${instrumentName}"` })
      }

      // Don't change drums to non-drums or vice versa
      if (track.isRhythmTrack && !instrumentInfo.isDrums) {
        return JSON.stringify({
          error: "Cannot change drum track to non-drum instrument",
        })
      }

      if (!track.isRhythmTrack && instrumentInfo.isDrums) {
        return JSON.stringify({
          error: "Cannot change non-drum track to drum instrument. Create a new drum track instead.",
        })
      }

      track.setProgramNumber(instrumentInfo.programNumber)
      track.setName(instrumentInfo.instrumentName)

      return JSON.stringify({
        trackId,
        instrumentName: instrumentInfo.instrumentName,
        programNumber: instrumentInfo.programNumber,
      })
    }

    case "setTrackVolume": {
      const trackId = args.trackId as number
      const volume = args.volume as number
      const tick = (args.tick as number) ?? 0

      const track = song.tracks[trackId]
      if (!track) {
        return JSON.stringify({ error: `Track ${trackId} not found` })
      }

      // Clamp volume to valid MIDI range
      const clampedVolume = Math.max(0, Math.min(127, volume))
      track.setVolume(clampedVolume, tick)

      return JSON.stringify({
        trackId,
        volume: clampedVolume,
        tick,
      })
    }

    case "setTrackPan": {
      const trackId = args.trackId as number
      const pan = args.pan as number
      const tick = (args.tick as number) ?? 0

      const track = song.tracks[trackId]
      if (!track) {
        return JSON.stringify({ error: `Track ${trackId} not found` })
      }

      // Clamp pan to valid MIDI range
      const clampedPan = Math.max(0, Math.min(127, pan))
      track.setPan(clampedPan, tick)

      return JSON.stringify({
        trackId,
        pan: clampedPan,
        tick,
      })
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
  toolCalls: ToolCall[],
): ToolResult[] {
  return toolCalls.map((tc) => ({
    id: tc.id,
    result: executeToolCall(song, tc),
  }))
}
