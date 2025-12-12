/**
 * MIDI manipulation tools for the DeepAgent.
 * These tools allow the agent to create tracks, add notes, and set tempo/time signature.
 */

import { z } from "zod"
import type { Song } from "@signal-app/core"
import {
  emptyTrack,
  timeSignatureMidiEvent,
  toTrackEvents,
} from "@signal-app/core"
import {
  getInstrumentProgramNumber,
  getInstrumentName,
} from "./instrumentMapping"

export interface ToolContext {
  song: Song
}

const DRUM_CHANNEL = 9
const MAX_MIDI_CHANNELS = 16

/**
 * Finds an available MIDI channel for a new track.
 * Skips channel 9 (reserved for drums) unless isDrums is true.
 */
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

  // Find first available channel, skipping 9 (drums)
  for (let ch = 0; ch < MAX_MIDI_CHANNELS; ch++) {
    if (ch === DRUM_CHANNEL) continue
    if (!usedChannels.has(ch)) {
      return ch
    }
  }

  // All channels used, default to 0
  return 0
}

// Schema definitions
export const createTrackSchema = z.object({
  instrumentName: z
    .string()
    .describe(
      'The instrument to use. GM names like "Acoustic Grand Piano" or aliases like "piano", "guitar", "drums"',
    ),
  trackName: z
    .string()
    .optional()
    .describe(
      "Optional custom name for the track. Defaults to the instrument name.",
    ),
})

const noteSchema = z.object({
  pitch: z
    .number()
    .min(0)
    .max(127)
    .describe("MIDI note number (0-127). Middle C = 60"),
  start: z
    .number()
    .min(0)
    .describe("Start position in ticks (480 = quarter note)"),
  duration: z
    .number()
    .min(1)
    .describe("Note duration in ticks (480 = quarter note)"),
  velocity: z
    .number()
    .min(1)
    .max(127)
    .optional()
    .describe("Note velocity/loudness (1-127). Default: 100"),
})

export const addNotesSchema = z.object({
  trackId: z.number().describe("The track ID returned from createTrack"),
  notes: z.array(noteSchema).describe("Array of notes to add"),
})

export const setTempoSchema = z.object({
  bpm: z.number().min(20).max(300).describe("Beats per minute (20-300)"),
  tick: z
    .number()
    .min(0)
    .optional()
    .describe("Position in ticks where tempo takes effect. Default: 0"),
})

export const setTimeSignatureSchema = z.object({
  numerator: z.number().min(1).max(16).describe("Beats per measure (1-16)"),
  denominator: z
    .number()
    .refine((n) => [2, 4, 8, 16].includes(n), {
      message: "Denominator must be 2, 4, 8, or 16",
    })
    .describe("Beat unit: 2=half, 4=quarter, 8=eighth, 16=sixteenth"),
  tick: z
    .number()
    .min(0)
    .optional()
    .describe(
      "Position in ticks where time signature takes effect. Default: 0",
    ),
})

// Type aliases for the schemas
type CreateTrackInput = z.infer<typeof createTrackSchema>
type AddNotesInput = z.infer<typeof addNotesSchema>
type SetTempoInput = z.infer<typeof setTempoSchema>
type SetTimeSignatureInput = z.infer<typeof setTimeSignatureSchema>

// Tool definition interface (compatible with LangChain but avoids deep type recursion)
export interface ToolDefinition<T> {
  name: string
  description: string
  schema: z.ZodType<T>
  func: (input: T) => Promise<string>
}

/**
 * Creates tool definitions for MIDI manipulation.
 * These can be converted to LangChain tools using DynamicStructuredTool.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createToolDefinitions(context: ToolContext): ToolDefinition<any>[] {
  const { song } = context

  const createTrack: ToolDefinition<CreateTrackInput> = {
    name: "createTrack",
    description: `Creates a new MIDI track with the specified instrument.
Use GM instrument names (e.g., "Acoustic Grand Piano", "Violin", "Alto Sax") or common aliases ("piano", "guitar", "bass", "drums").
For drums/percussion, use "drums" which will automatically use MIDI channel 10 (index 9).
Returns the trackId which you'll need for addNotes calls.`,
    schema: createTrackSchema,
    func: async ({ instrumentName, trackName }) => {
      // Resolve instrument
      const instrumentInfo = getInstrumentProgramNumber(instrumentName)
      if (!instrumentInfo) {
        return JSON.stringify({
          error: `Unknown instrument: "${instrumentName}". Try a GM instrument name like "Acoustic Grand Piano" or an alias like "piano".`,
        })
      }

      // Get channel
      const channel = getAvailableChannel(song, instrumentInfo.isDrums)

      // Create track
      const track = emptyTrack(channel)
      track.setName(trackName ?? instrumentInfo.instrumentName)

      if (!instrumentInfo.isDrums) {
        track.setProgramNumber(instrumentInfo.programNumber)
      }

      // Add to song
      song.addTrack(track)

      // Find the track ID (index in song.tracks)
      const trackId = song.tracks.indexOf(track)

      return JSON.stringify({
        trackId,
        instrumentName: instrumentInfo.instrumentName,
        programNumber: instrumentInfo.programNumber,
        channel,
        isDrums: instrumentInfo.isDrums,
      })
    },
  }

  const addNotes: ToolDefinition<AddNotesInput> = {
    name: "addNotes",
    description: `Adds notes to an existing track.
Pitch uses MIDI note numbers: middle C = 60, C# = 61, D = 62, etc. Each octave is 12 semitones.
Timing uses ticks where 480 ticks = 1 quarter note at the default timebase.
Common durations: whole note = 1920, half = 960, quarter = 480, eighth = 240, sixteenth = 120.
Velocity is 1-127 (loudness), default 100.`,
    schema: addNotesSchema,
    func: async ({ trackId, notes }) => {
      const track = song.tracks[trackId]
      if (!track) {
        return JSON.stringify({
          error: `Track ${trackId} not found. Available tracks: 0-${song.tracks.length - 1}`,
        })
      }

      // Convert notes to track events
      const noteEvents = notes.map((note) => ({
        type: "channel" as const,
        subtype: "note" as const,
        noteNumber: note.pitch,
        tick: note.start,
        duration: note.duration,
        velocity: note.velocity ?? 100,
      }))

      // Add all notes
      track.addEvents(noteEvents)

      return JSON.stringify({
        trackId,
        noteCount: notes.length,
      })
    },
  }

  const setTempo: ToolDefinition<SetTempoInput> = {
    name: "setTempo",
    description: `Sets the tempo (BPM) at a specific position in the song.
Common tempos: Largo 40-60, Adagio 66-76, Andante 76-108, Moderato 108-120, Allegro 120-168, Presto 168-200.
Use tick=0 to set the initial tempo. Use other tick values for tempo changes mid-song.`,
    schema: setTempoSchema,
    func: async ({ bpm, tick }) => {
      const conductor = song.conductorTrack
      if (!conductor) {
        return JSON.stringify({
          error:
            "No conductor track found. The song may not be properly initialized.",
        })
      }

      conductor.setTempo(bpm, tick ?? 0)

      return JSON.stringify({
        bpm,
        tick: tick ?? 0,
      })
    },
  }

  const setTimeSignature: ToolDefinition<SetTimeSignatureInput> = {
    name: "setTimeSignature",
    description: `Sets the time signature at a specific position.
Common signatures: 4/4 (common time), 3/4 (waltz), 6/8 (compound duple), 2/4 (march).
The numerator is beats per measure, denominator is the note value (4=quarter, 8=eighth).`,
    schema: setTimeSignatureSchema,
    func: async ({ numerator, denominator, tick }) => {
      const conductor = song.conductorTrack
      if (!conductor) {
        return JSON.stringify({
          error:
            "No conductor track found. The song may not be properly initialized.",
        })
      }

      // Use toTrackEvents to properly convert the MIDI event, then add
      const [tsEvent] = toTrackEvents([
        timeSignatureMidiEvent(0, numerator, denominator),
      ])

      // Add with the correct tick
      conductor.addEvent({
        ...tsEvent,
        tick: tick ?? 0,
      })

      return JSON.stringify({
        numerator,
        denominator,
        tick: tick ?? 0,
      })
    },
  }

  return [createTrack, addNotes, setTempo, setTimeSignature]
}

/**
 * Creates LangChain-compatible tools from tool definitions.
 * Import this in the AgentService to avoid type instantiation issues in tools.ts
 */
export function createTools(context: ToolContext) {
  // Lazy import to avoid TypeScript deep instantiation during type checking
  // The actual DynamicStructuredTool creation happens at runtime
  const definitions = createToolDefinitions(context)
  return definitions.map((def) => ({
    name: def.name,
    description: def.description,
    schema: def.schema,
    invoke: def.func,
  }))
}

export { getInstrumentProgramNumber, getInstrumentName }
