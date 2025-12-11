import {
  getSampleEventsFromSoundFont,
  renderAudio as render,
} from "@ryohey/wavelet"
import { PlayerEvent } from "./PlayerEvent.js"
import { toSynthEvents } from "./toSynthEvents.js"

/**
 * Create an AudioBuffer from rendered audio data.
 * This is a local implementation to avoid potential issues with the wavelet export.
 */
function createAudioBuffer(
  audioData: {
    length: number
    sampleRate: number
    leftData: ArrayBuffer
    rightData: ArrayBuffer
  },
  fallbackSampleRate: number,
): AudioBuffer {
  const rate = audioData.sampleRate ?? fallbackSampleRate
  const audioBuffer = new AudioBuffer({
    length: audioData.length,
    sampleRate: rate,
    numberOfChannels: 2,
  })
  audioBuffer.copyToChannel(new Float32Array(audioData.leftData), 0)
  audioBuffer.copyToChannel(new Float32Array(audioData.rightData), 1)
  return audioBuffer
}

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
  if (!soundFontData || soundFontData.byteLength === 0) {
    throw new Error("renderAudio: soundFontData is empty or undefined")
  }

  const sampleEvents = getSampleEventsFromSoundFont(
    new Uint8Array(soundFontData),
  )

  if (!sampleEvents || sampleEvents.length === 0) {
    throw new Error(
      "renderAudio: No sample events extracted from SoundFont. The SoundFont may be incompatible.",
    )
  }

  const synthEvents = toSynthEvents(events, timebase, sampleRate)

  if (!synthEvents || synthEvents.length === 0) {
    throw new Error(
      "renderAudio: No synth events generated. The song may have no playable notes.",
    )
  }

  const samples = sampleEvents.map((e) => e.event)
  const audioData = await render(samples, synthEvents, {
    sampleRate,
    bufferSize: options.bufferSize,
    cancel: options.cancel,
    waitForEventLoop: options.waitForEventLoop,
    onProgress: options.onProgress,
  })

  if (!audioData) {
    throw new Error("renderAudio: render() returned undefined audioData")
  }

  // Use our own implementation to create AudioBuffer to avoid potential issues
  // with the wavelet audioDataToAudioBuffer export
  return createAudioBuffer(audioData, sampleRate)
}
