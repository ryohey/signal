/**
 * Load an audio file into an AudioBuffer
 */
export async function loadAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer()
  const audioContext = new AudioContext()

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    await audioContext.close()
    return audioBuffer
  } catch (error) {
    await audioContext.close()
    throw new Error(
      `Failed to decode audio file: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

/**
 * Resample AudioBuffer to target sample rate using OfflineAudioContext
 */
export async function resampleAudioBuffer(
  audioBuffer: AudioBuffer,
  targetSampleRate: number,
): Promise<AudioBuffer> {
  const offlineContext = new OfflineAudioContext(
    1, // mono
    Math.ceil(audioBuffer.duration * targetSampleRate),
    targetSampleRate,
  )

  const source = offlineContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(offlineContext.destination)
  source.start(0)

  const resampled = await offlineContext.startRendering()
  return resampled
}

/**
 * Convert AudioBuffer to mono Float32Array
 */
export function audioBufferToFloat32(audioBuffer: AudioBuffer): Float32Array {
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
