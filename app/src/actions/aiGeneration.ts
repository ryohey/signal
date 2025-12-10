import { useCallback } from "react"
import { Song, songFromMidi, conductorTrack } from "@signal-app/core"
import { useSetSong } from "./song"
import { useStores } from "../hooks/useStores"
import { usePlayer } from "../hooks/usePlayer"
import { GenerateResponse, TrackData } from "../services/aiBackend/types"

/**
 * Decode base64 MIDI data to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Convert API track data to Signal Song
 */
function apiResponseToSong(response: GenerateResponse): Song {
  // Create a new song
  const song = new Song()
  song.name = "AI Generated Song"
  song.timebase = 480 // Standard MIDI PPQ

  // Add conductor track first (required for playback)
  // This contains tempo and time signature information
  const conductor = conductorTrack("AI Generated Song")
  song.addTrack(conductor)

  // Set tempo on conductor track from metadata
  if (response.metadata.tempo) {
    conductor.setTempo(response.metadata.tempo, 0)
  }

  // Load each track's MIDI and extract events
  for (const trackData of response.tracks) {
    const midiBytes = base64ToUint8Array(trackData.midiData)

    // Parse the MIDI file
    const trackSong = songFromMidi(midiBytes)

    // Get the first non-conductor track (the actual notes)
    const sourceTrack = trackSong.tracks.find((t) => !t.isConductorTrack)

    if (sourceTrack) {
      // Set track metadata
      sourceTrack.setName(trackData.name)
      sourceTrack.channel = trackData.channel
      sourceTrack.setProgramNumber(trackData.programNumber)

      // Add to our song
      song.addTrack(sourceTrack)
    }
  }

  return song
}

/**
 * Hook to load AI-generated song into Signal
 */
export function useLoadAISong() {
  const setSong = useSetSong()
  const { stop } = usePlayer()

  return useCallback(
    (response: GenerateResponse) => {
      // Stop playback
      stop()

      // Convert API response to Song
      const song = apiResponseToSong(response)

      // Load into Signal
      setSong(song)

      return song
    },
    [setSong, stop],
  )
}

/**
 * Hook to regenerate a single track
 */
export function useRegenerateTrack() {
  const { songStore } = useStores()

  return useCallback(
    (trackData: TrackData) => {
      const song = songStore.song

      // Find existing track by name
      const existingTrack = song.tracks.find(
        (t) => t.name?.toLowerCase() === trackData.name.toLowerCase(),
      )

      if (!existingTrack) {
        console.warn(`Track "${trackData.name}" not found`)
        return
      }

      // Parse new MIDI data
      const midiBytes = base64ToUint8Array(trackData.midiData)
      const trackSong = songFromMidi(midiBytes)
      const sourceTrack = trackSong.tracks.find((t) => !t.isConductorTrack)

      if (!sourceTrack) {
        console.warn("No track data in response")
        return
      }

      // Clear existing events and add new ones
      const eventIds = existingTrack.events.map((e) => e.id)
      existingTrack.removeEvents(eventIds)

      // Add new events
      existingTrack.addEvents(
        sourceTrack.events.map((e) => ({
          ...e,
          id: undefined, // Let Signal assign new IDs
        })),
      )

      // Update program number if changed
      existingTrack.setProgramNumber(trackData.programNumber)
    },
    [songStore],
  )
}
