import { Track, NoteEvent } from "@signal-app/core"
import { emptyTrack } from "@signal-app/core"
import type { SongStore } from "../../stores/SongStore"

export interface TrackSpec {
  name: string
  channel: number
  program_number?: number
}

export interface NoteSpec {
  note_number: number
  tick: number
  duration: number
  velocity: number
}

export interface EffectSpec {
  effect_type: "volume" | "pan" | "program_change"
  value: number
  tick: number
}

export interface ToolCallResult {
  success: boolean
  tracks_added?: number
  notes_added?: number
  effects_added?: number
  track_names?: string[]
  errors?: string[]
  message?: string
}

export class ToolExecutor {
  constructor(private songStore: SongStore) {}

  /**
   * Execute add_tracks tool call
   */
  executeAddTracks(tracks: TrackSpec[]): ToolCallResult {
    const errors: string[] = []
    const trackNames: string[] = []

    try {
      // Validate all tracks first
      for (const trackSpec of tracks) {
        if (trackSpec.channel < 0 || trackSpec.channel > 15) {
          errors.push(
            `Invalid channel ${trackSpec.channel} for track "${trackSpec.name}". Channel must be 0-15.`,
          )
          continue
        }

        if (
          trackSpec.program_number !== undefined &&
          (trackSpec.program_number < 0 || trackSpec.program_number > 127)
        ) {
          errors.push(
            `Invalid program number ${trackSpec.program_number} for track "${trackSpec.name}". Program must be 0-127.`,
          )
          continue
        }

        // Check if track name already exists
        const existingTrack = this.songStore.song.tracks.find(
          (t) => t.name?.toLowerCase() === trackSpec.name.toLowerCase(),
        )
        if (existingTrack) {
          errors.push(
            `Track "${trackSpec.name}" already exists. Use a different name.`,
          )
          continue
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          errors,
          tracks_added: 0,
        }
      }

      // Create and add tracks
      const newTracks: Track[] = []
      for (const trackSpec of tracks) {
        const track = emptyTrack(trackSpec.channel)
        track.setName(trackSpec.name)
        if (trackSpec.program_number !== undefined) {
          track.setProgramNumber(trackSpec.program_number)
        }
        newTracks.push(track)
        trackNames.push(trackSpec.name)
      }

      // Add tracks one by one using addTrack (singular)
      for (const track of newTracks) {
        this.songStore.song.addTrack(track)
      }

      return {
        success: true,
        tracks_added: newTracks.length,
        track_names: trackNames,
        message: `Successfully added ${newTracks.length} track(s): ${trackNames.join(", ")}`,
      }
    } catch (error) {
      return {
        success: false,
        errors: [
          error instanceof Error ? error.message : "Unknown error adding tracks",
        ],
        tracks_added: 0,
      }
    }
  }

  /**
   * Execute add_notes tool call
   */
  executeAddNotes(trackName: string, notes: NoteSpec[]): ToolCallResult {
    try {
      // Find track by name
      const track = this.songStore.song.tracks.find(
        (t) => t.name?.toLowerCase() === trackName.toLowerCase(),
      )

      if (!track) {
        const availableTracks = this.songStore.song.tracks
          .filter((t) => !t.isConductorTrack)
          .map((t) => t.name || "Unnamed")
          .join(", ")

        return {
          success: false,
          errors: [
            `Track "${trackName}" not found. Available tracks: ${availableTracks || "none"}`,
          ],
          notes_added: 0,
        }
      }

      // Validate all notes first
      const errors: string[] = []
      for (const noteSpec of notes) {
        if (noteSpec.note_number < 0 || noteSpec.note_number > 127) {
          errors.push(
            `Invalid note number ${noteSpec.note_number}. Must be 0-127.`,
          )
        }
        if (noteSpec.tick < 0) {
          errors.push(`Invalid tick ${noteSpec.tick}. Must be >= 0.`)
        }
        if (noteSpec.duration <= 0) {
          errors.push(
            `Invalid duration ${noteSpec.duration}. Must be > 0.`,
          )
        }
        if (noteSpec.velocity < 1 || noteSpec.velocity > 127) {
          errors.push(
            `Invalid velocity ${noteSpec.velocity}. Must be 1-127.`,
          )
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          errors,
          notes_added: 0,
        }
      }

      // Convert note specs to NoteEvent format
      const noteEvents: Omit<NoteEvent, "id">[] = notes.map((noteSpec) => ({
        type: "channel",
        subtype: "note",
        noteNumber: noteSpec.note_number,
        tick: noteSpec.tick,
        duration: noteSpec.duration,
        velocity: noteSpec.velocity,
      }))

      // Add all notes in batch
      track.addEvents(noteEvents)

      return {
        success: true,
        notes_added: notes.length,
        message: `Successfully added ${notes.length} note(s) to track "${trackName}"`,
      }
    } catch (error) {
      return {
        success: false,
        errors: [
          error instanceof Error ? error.message : "Unknown error adding notes",
        ],
        notes_added: 0,
      }
    }
  }

  /**
   * Execute add_effects tool call
   */
  executeAddEffects(trackName: string, effects: EffectSpec[]): ToolCallResult {
    try {
      // Find track by name
      const track = this.songStore.song.tracks.find(
        (t) => t.name?.toLowerCase() === trackName.toLowerCase(),
      )

      if (!track) {
        const availableTracks = this.songStore.song.tracks
          .filter((t) => !t.isConductorTrack)
          .map((t) => t.name || "Unnamed")
          .join(", ")

        return {
          success: false,
          errors: [
            `Track "${trackName}" not found. Available tracks: ${availableTracks || "none"}`,
          ],
          effects_added: 0,
        }
      }

      // Validate all effects first
      const errors: string[] = []
      for (const effectSpec of effects) {
        if (effectSpec.tick < 0) {
          errors.push(`Invalid tick ${effectSpec.tick}. Must be >= 0.`)
        }

        if (effectSpec.effect_type === "volume" || effectSpec.effect_type === "pan") {
          if (effectSpec.value < 0 || effectSpec.value > 127) {
            errors.push(
              `Invalid ${effectSpec.effect_type} value ${effectSpec.value}. Must be 0-127.`,
            )
          }
        } else if (effectSpec.effect_type === "program_change") {
          if (effectSpec.value < 0 || effectSpec.value > 127) {
            errors.push(
              `Invalid program_change value ${effectSpec.value}. Must be 0-127.`,
            )
          }
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          errors,
          effects_added: 0,
        }
      }

      // Apply effects
      let effectsAdded = 0
      for (const effectSpec of effects) {
        try {
          if (effectSpec.effect_type === "volume") {
            track.setVolume(Math.round(effectSpec.value), effectSpec.tick)
            effectsAdded++
          } else if (effectSpec.effect_type === "pan") {
            track.setPan(Math.round(effectSpec.value), effectSpec.tick)
            effectsAdded++
          } else if (effectSpec.effect_type === "program_change") {
            track.setProgramNumber(Math.round(effectSpec.value))
            effectsAdded++
          }
        } catch (error) {
          errors.push(
            `Failed to add ${effectSpec.effect_type}: ${error instanceof Error ? error.message : "Unknown error"}`,
          )
        }
      }

      if (errors.length > 0 && effectsAdded === 0) {
        return {
          success: false,
          errors,
          effects_added: 0,
        }
      }

      return {
        success: true,
        effects_added: effectsAdded,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully added ${effectsAdded} effect(s) to track "${trackName}"${errors.length > 0 ? ` (${errors.length} failed)` : ""}`,
      }
    } catch (error) {
      return {
        success: false,
        errors: [
          error instanceof Error ? error.message : "Unknown error adding effects",
        ],
        effects_added: 0,
      }
    }
  }
}

