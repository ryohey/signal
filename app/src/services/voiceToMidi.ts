/**
 * Voice-to-MIDI service - orchestrates the full pipeline
 */
import {
  PitchSegment,
  InterpretedNote,
  RhythmInterpretationResponse,
} from "./voiceToMidiTypes"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

export interface VoiceToMidiOptions {
  quantizeValue: number // 4=quarter, 8=eighth, etc.
  timebase: number // usually 480
  projectTempo: number // current BPM
  onProgress?: (stage: string, progress: number) => void
  // New key hint fields
  keyHint?: number // 0-11 (C=0), if user has key signature set
  scaleHint?: "major" | "minor" // if user has key signature set
}

export interface VoiceToMidiResult {
  notes: InterpretedNote[]
  detectedTempo: number
  tempoConfidence: "high" | "medium" | "low"
  timeSignature: [number, number]
  // New key detection results
  detectedKey: number
  detectedScale: "major" | "minor"
  keyConfidence: "high" | "medium" | "low"
  pitchOffsetCents: number
  keySource: "user_provided" | "detected_confident" | "detected_low_confidence"
}

interface PitchDetectionResponse {
  segments: PitchSegment[]
  duration_seconds: number
  sample_rate: number
  model_used: string
}

/**
 * Process audio blob through CREPE and LLM to get MIDI notes
 */
export async function processVoiceToMidi(
  audioBlob: Blob,
  options: VoiceToMidiOptions,
): Promise<VoiceToMidiResult> {
  const {
    quantizeValue,
    timebase,
    projectTempo,
    onProgress,
    keyHint,
    scaleHint,
  } = options

  // Step 1: Send to CREPE
  onProgress?.("Detecting pitches...", 0.2)

  const formData = new FormData()
  formData.append("file", audioBlob, "recording.webm")

  const pitchResponse = await fetch(
    `${API_BASE}/api/detect-pitch?model_capacity=small`,
    {
      method: "POST",
      body: formData,
    },
  )

  if (!pitchResponse.ok) {
    const error = await pitchResponse.text()
    throw new Error(`Pitch detection failed: ${error}`)
  }

  const pitchData: PitchDetectionResponse = await pitchResponse.json()

  if (!pitchData.segments || pitchData.segments.length === 0) {
    throw new Error(
      "No pitches detected in recording. Try humming more clearly.",
    )
  }

  onProgress?.("Interpreting rhythm & detecting key...", 0.6)

  // Step 2: Send to LLM for rhythm interpretation (now with key detection)
  const rhythmRequestBody: Record<string, unknown> = {
    segments: pitchData.segments,
    quantize_value: quantizeValue,
    timebase: timebase,
    project_tempo: projectTempo,
  }

  // Add key hint if provided
  if (keyHint !== undefined && scaleHint !== undefined) {
    rhythmRequestBody.key_hint = keyHint
    rhythmRequestBody.scale_hint = scaleHint
  }

  const rhythmResponse = await fetch(`${API_BASE}/api/interpret-rhythm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rhythmRequestBody),
  })

  if (!rhythmResponse.ok) {
    const error = await rhythmResponse.text()
    throw new Error(`Rhythm interpretation failed: ${error}`)
  }

  const rhythmData: RhythmInterpretationResponse = await rhythmResponse.json()

  onProgress?.("Complete!", 1.0)

  return {
    notes: rhythmData.notes,
    detectedTempo: rhythmData.detected_tempo,
    tempoConfidence: rhythmData.tempo_confidence,
    timeSignature: rhythmData.time_signature,
    detectedKey: rhythmData.detected_key,
    detectedScale: rhythmData.detected_scale,
    keyConfidence: rhythmData.key_confidence,
    pitchOffsetCents: rhythmData.pitch_offset_cents,
    keySource: rhythmData.key_source,
  }
}
