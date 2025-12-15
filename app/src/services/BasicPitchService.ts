import {
  BasicPitch,
  outputToNotesPoly,
  noteFramesToTime,
  addPitchBendsToNoteEvents,
  type NoteEventTime,
} from "@spotify/basic-pitch"

export interface BasicPitchNote {
  startTime: number // seconds
  duration: number // seconds
  pitch: number // MIDI note number
  amplitude: number // 0-1
  pitchBend?: number[] // optional pitch bend data
}

export interface TranscriptionOptions {
  onsetThreshold?: number // 0-1, default 0.5
  frameThreshold?: number // 0-1, default 0.3
  minimumNoteDuration?: number // seconds, default 0.127
  minimumFrequency?: number // Hz, default 65.41 (C2)
  maximumFrequency?: number // Hz, default 2093.0 (C7)
  onProgress?: (percent: number) => void // Progress callback
}

export class BasicPitchService {
  private basicPitch: BasicPitch | null = null
  private modelPath = "/models/basic-pitch/model.json"

  async loadModel(): Promise<void> {
    if (this.basicPitch) return

    this.basicPitch = new BasicPitch(this.modelPath)
    // Wait for model to load
    await this.basicPitch.model
  }

  async transcribeAudio(
    audioBuffer: AudioBuffer,
    options: TranscriptionOptions = {},
  ): Promise<BasicPitchNote[]> {
    await this.loadModel()

    if (!this.basicPitch) {
      throw new Error("Basic Pitch model not loaded")
    }

    // Convert AudioBuffer to Float32Array (mono)
    const audioData = this.audioBufferToMono(audioBuffer)

    // Run inference
    const { frames, onsets, contours } = await this.runInference(
      audioData,
      options.onProgress,
    )

    // Post-process to extract notes
    const notes = this.extractNotes(frames, onsets, contours, options)

    return notes
  }

  private audioBufferToMono(audioBuffer: AudioBuffer): Float32Array {
    // If already mono, return channel data
    if (audioBuffer.numberOfChannels === 1) {
      return audioBuffer.getChannelData(0)
    }

    // Mix down to mono by averaging channels
    const length = audioBuffer.length
    const result = new Float32Array(length)

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        result[i] += channelData[i] / audioBuffer.numberOfChannels
      }
    }

    return result
  }

  private async runInference(
    audioData: Float32Array,
    onProgress?: (percent: number) => void,
  ): Promise<{
    frames: number[][]
    onsets: number[][]
    contours: number[][]
  }> {
    if (!this.basicPitch) {
      throw new Error("Basic Pitch model not loaded")
    }

    return new Promise((resolve, reject) => {
      let frames: number[][] = []
      let onsets: number[][] = []
      let contours: number[][] = []

      this.basicPitch!.evaluateModel(
        audioData,
        (framesResult, onsetsResult, contoursResult) => {
          frames = framesResult
          onsets = onsetsResult
          contours = contoursResult
        },
        (percent) => {
          if (onProgress) {
            onProgress(percent)
          }
        },
      )
        .then(() => {
          resolve({ frames, onsets, contours })
        })
        .catch(reject)
    })
  }

  private extractNotes(
    frames: number[][],
    onsets: number[][],
    contours: number[][],
    options: TranscriptionOptions,
  ): BasicPitchNote[] {
    const {
      onsetThreshold = 0.5,
      frameThreshold = 0.3,
      minimumNoteDuration = 0.127,
      minimumFrequency = 65.41,
      maximumFrequency = 2093.0,
    } = options

    // Convert minimum duration from seconds to frames
    // Basic Pitch uses ~86.13 ms per frame
    const minNoteFrames = Math.ceil(minimumNoteDuration / 0.08613)

    // Extract notes using Basic Pitch's post-processing
    const noteEvents = outputToNotesPoly(
      frames,
      onsets,
      onsetThreshold,
      frameThreshold,
      minNoteFrames,
      true, // infer onsets
      maximumFrequency,
      minimumFrequency,
      true, // melodia trick
      11, // energy tolerance
    )

    // Add pitch bends
    const noteEventsWithBends = addPitchBendsToNoteEvents(contours, noteEvents)

    // Convert from frames to time
    const noteEventsTime: NoteEventTime[] =
      noteFramesToTime(noteEventsWithBends)

    // Convert to our format
    return noteEventsTime.map((note) => ({
      startTime: note.startTimeSeconds,
      duration: note.durationSeconds,
      pitch: note.pitchMidi,
      amplitude: note.amplitude,
      pitchBend: note.pitchBends,
    }))
  }
}
