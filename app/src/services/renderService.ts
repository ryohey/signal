/**
 * Service for rendering MIDI to high-quality audio via FluidSynth backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

export interface RenderResult {
  audioBlob: Blob
  audioUrl: string
}

/**
 * Render MIDI data to WAV audio using the backend FluidSynth service.
 */
export async function renderMidiToAudio(midiData: Uint8Array, soundfontName?: string): Promise<RenderResult> {
  // Convert MIDI bytes to base64
  const midiBase64 = btoa(String.fromCharCode(...midiData))

  // Clean up soundfont name - remove parenthetical suffixes like "(Signal Factory Sound)"
  const cleanSoundfontName = soundfontName?.replace(/\s*\([^)]*\)\s*$/, "").trim()

  const response = await fetch(`${API_BASE_URL}/api/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      midi_base64: midiBase64,
      soundfont: cleanSoundfontName,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(error.detail || `Render failed: ${response.status}`)
  }

  const audioBlob = await response.blob()
  const audioUrl = URL.createObjectURL(audioBlob)

  return { audioBlob, audioUrl }
}

/**
 * Clean up an audio URL created by renderMidiToAudio.
 */
export function revokeAudioUrl(audioUrl: string) {
  URL.revokeObjectURL(audioUrl)
}
