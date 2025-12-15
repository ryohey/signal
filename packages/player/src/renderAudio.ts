import { PlayerEvent } from "./PlayerEvent.js"

/**
 * Render audio from player events to an AudioBuffer.
 *
 * NOTE: This functionality is temporarily disabled after migrating from wavelet to spessasynth_lib.
 * SpessaSynth's offline rendering requires MIDI file input (BasicMIDI format) rather than
 * individual events. Implementing this properly requires either:
 * 1. Converting PlayerEvents to a MIDI file format
 * 2. Using spessasynth's Sequencer with the MIDI file
 * 3. Using startOfflineRender() with the MIDI data
 *
 * For now, audio export will show an error. Real-time playback works fine.
 *
 * @throws Error indicating that audio export is not yet implemented with the new synth engine
 */
export const renderAudio = async (
  soundFontData: ArrayBuffer,
  events: PlayerEvent[],
  timebase: number,
  sampleRate: number,
  options: {
    bufferSize: number
    cancel?: () => boolean
    waitForEventLoop?: () => Promise<void>
    onProgress?: (numFrames: number, totalFrames: number) => void
  },
): Promise<AudioBuffer> => {
  throw new Error(
    "Audio export is temporarily unavailable. " +
      "The synthesizer engine was upgraded to spessasynth_lib for better sound quality. " +
      "Audio export functionality will be restored in a future update. " +
      "Real-time playback works normally.",
  )
}
