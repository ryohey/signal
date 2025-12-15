import { emptyTrack } from "@signal-app/core"
import { useCallback, useState } from "react"
import { convertBasicPitchNotes } from "../helpers/basicPitchConverter"
import type { NoteQuantizationSettings } from "../helpers/basicPitchConverter"
import { loadAudioFile } from "../helpers/audioLoader"
import { useConductorTrack } from "../hooks/useConductorTrack"
import { useSong } from "../hooks/useSong"
import { BasicPitchService } from "../services/BasicPitchService"

export interface AudioImportResult {
  success: boolean
  trackId?: number
  noteCount?: number
  error?: string
}

export const useImportAudio = () => {
  const { getSong, addTrack, tracks } = useSong()
  const { currentTempo } = useConductorTrack()
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const importAudio = useCallback(
    async (
      file: File,
      settings: NoteQuantizationSettings,
    ): Promise<AudioImportResult> => {
      setIsProcessing(true)
      setProgress(0)

      try {
        // Load audio file
        setProgress(10)
        const audioBuffer = await loadAudioFile(file)

        // Transcribe with Basic Pitch
        setProgress(30)
        const service = new BasicPitchService()
        const basicPitchNotes = await service.transcribeAudio(audioBuffer, {
          onsetThreshold: 0.5,
          frameThreshold: 0.3,
          minimumNoteDuration: settings.minimumNoteDuration,
          onProgress: (percent) => {
            // Map progress from 30% to 70% during transcription
            setProgress(30 + percent * 0.4)
          },
        })

        setProgress(70)

        // Convert to DetectedNote format
        const tempo = currentTempo ?? 120
        const detectedNotes = convertBasicPitchNotes(
          basicPitchNotes,
          tempo,
          settings,
        )

        setProgress(90)

        // Create new track with transcribed notes
        const song = getSong()
        const track = emptyTrack(Math.min(tracks.length - 1, 0xf))
        track.setName(file.name.replace(/\.[^/.]+$/, "")) // Remove extension

        // Convert DetectedNote to TrackEvent (NoteEvent)
        const noteEvents = detectedNotes.map((note) => ({
          type: "channel" as const,
          subtype: "note" as const,
          noteNumber: note.pitch,
          tick: note.start,
          duration: note.duration,
          velocity: note.velocity,
        }))

        track.addEvents(noteEvents)
        addTrack(track)

        setProgress(100)

        return {
          success: true,
          trackId: song.tracks.indexOf(track),
          noteCount: detectedNotes.length,
        }
      } catch (error) {
        console.error("Audio import failed:", error)
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        }
      } finally {
        setIsProcessing(false)
        setProgress(0)
      }
    },
    [getSong, addTrack, tracks, currentTempo],
  )

  return {
    importAudio,
    isProcessing,
    progress,
  }
}

export const useOpenAudioFile = () => {
  return useCallback(async (): Promise<File | null> => {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Audio files",
            accept: {
              "audio/mpeg": [".mp3"],
              "audio/wav": [".wav"],
              "audio/ogg": [".ogg"],
              "audio/flac": [".flac"],
            },
          },
        ],
      })

      return await fileHandle.getFile()
    } catch (ex) {
      if ((ex as Error).name === "AbortError") {
        return null
      }
      console.error("Error opening audio file:", ex)
      throw ex
    }
  }, [])
}
