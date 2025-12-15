import type { BasicPitchNote } from "../services/BasicPitchService"
import type { DetectedNote } from "../components/AIChat/VoiceRecorder"

export interface NoteQuantizationSettings {
  pitchCorrectionStrength: number // 0-100, how much to snap to nearest note
  minimumNoteDuration: number // minimum duration in seconds
  velocitySensitivity: number // 0-100, affects velocity range
  snapToScale?: number[] // array of MIDI notes to snap to (e.g. C major scale)
}

/**
 * Convert Basic Pitch notes to DetectedNote format with quantization
 */
export function convertBasicPitchNotes(
  notes: BasicPitchNote[],
  tempo: number,
  settings: NoteQuantizationSettings,
): DetectedNote[] {
  const TICKS_PER_QUARTER = 480

  return notes
    .filter((note) => note.duration >= settings.minimumNoteDuration)
    .map((note) => {
      // Convert time to ticks
      const startTicks = Math.round(
        note.startTime * (tempo / 60) * TICKS_PER_QUARTER,
      )
      const durationTicks = Math.round(
        note.duration * (tempo / 60) * TICKS_PER_QUARTER,
      )

      // Apply pitch correction/quantization
      const quantizedPitch = quantizePitch(
        note.pitch,
        settings.pitchCorrectionStrength,
        settings.snapToScale,
      )

      // Convert amplitude to velocity with sensitivity adjustment
      const velocity = amplitudeToVelocity(
        note.amplitude,
        settings.velocitySensitivity,
      )

      return {
        pitch: quantizedPitch,
        start: startTicks,
        duration: durationTicks,
        velocity,
      }
    })
}

/**
 * Quantize pitch based on correction strength and optional scale
 */
function quantizePitch(
  pitch: number,
  correctionStrength: number,
  snapToScale?: number[],
): number {
  const strength = correctionStrength / 100

  if (strength === 0) {
    // No correction - use exact pitch (may have decimal places)
    return Math.round(pitch)
  }

  let targetPitch: number

  if (snapToScale && snapToScale.length > 0) {
    // Find nearest note in scale
    targetPitch = findNearestScaleNote(pitch, snapToScale)
  } else {
    // Snap to nearest chromatic note
    targetPitch = Math.round(pitch)
  }

  // Interpolate between original and target based on strength
  const quantized = pitch + (targetPitch - pitch) * strength

  return Math.round(quantized)
}

/**
 * Find nearest MIDI note in the given scale
 */
function findNearestScaleNote(pitch: number, scale: number[]): number {
  const octave = Math.floor(pitch / 12)
  const pitchClass = pitch % 12

  // Find closest scale degree
  let minDistance = Infinity
  let closestScaleDegree = scale[0]

  for (const degree of scale) {
    const distance = Math.abs(pitchClass - degree)
    if (distance < minDistance) {
      minDistance = distance
      closestScaleDegree = degree
    }
  }

  return octave * 12 + closestScaleDegree
}

/**
 * Convert amplitude (0-1) to MIDI velocity (1-127) with sensitivity
 */
function amplitudeToVelocity(amplitude: number, sensitivity: number): number {
  // Sensitivity affects dynamic range
  // Lower sensitivity = narrower range (more uniform velocities)
  // Higher sensitivity = wider range (more dynamic variation)

  const minVelocity = 127 - sensitivity
  const range = sensitivity

  const velocity = Math.round(minVelocity + amplitude * range)
  return Math.max(1, Math.min(127, velocity))
}
