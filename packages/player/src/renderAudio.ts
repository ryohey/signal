import {
  audioDataToAudioBuffer,
  getSampleEventsFromSoundFont,
  renderAudio as render,
} from "@ryohey/wavelet"
import { PlayerEvent } from "./PlayerEvent.js"
import { toSynthEvents } from "./toSynthEvents.js"

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
  const sampleEvents = getSampleEventsFromSoundFont(
    new Uint8Array(soundFontData),
  )
  const synthEvents = toSynthEvents(events, timebase, sampleRate)

  const samples = sampleEvents.map((e) => e.event)
  const audioData = await render(samples, synthEvents, {
    sampleRate,
    bufferSize: options.bufferSize,
    cancel: options.cancel,
    waitForEventLoop: options.waitForEventLoop,
    onProgress: options.onProgress,
  })

  return audioDataToAudioBuffer(audioData)
}
