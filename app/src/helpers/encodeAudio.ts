import { Mp3Encoder } from "@breezystack/lamejs"
import { max } from "lodash"
import { encode } from "wav-encoder"

export const encodeMp3 = async (audioBuffer: AudioBuffer) => {
  const mp3Encoder = new Mp3Encoder(
    audioBuffer.numberOfChannels,
    audioBuffer.sampleRate,
    128,
  )
  const mp3Data: Uint8Array[] = []

  const [left, right] = [
    audioBuffer.getChannelData(0),
    audioBuffer.getChannelData(1),
  ]

  const l = new Int16Array(left.length)
  const r = new Int16Array(right.length)

  // Find the maximum amplitude to prevent clipping
  const maxAmplitude = Math.max(
    max(left.map((v) => Math.abs(v))) ?? 0,
    max(right.map((v) => Math.abs(v))) ?? 0,
  )

  //Convert to required format
  for (let i = 0; i < left.length; i++) {
    l[i] = (left[i] / maxAmplitude) * 32767.5
    r[i] = (right[i] / maxAmplitude) * 32767.5
  }

  const sampleBlockSize = 1152 //can be anything but make it a multiple of 576 to make encoders life easier

  for (let i = 0; i < l.length; i += sampleBlockSize) {
    const leftChunk = l.subarray(i, i + sampleBlockSize)
    const rightChunk = r.subarray(i, i + sampleBlockSize)

    const mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk)

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf)
    }
  }
  const mp3buf = mp3Encoder.flush() //finish writing mp3

  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf)
  }

  return concatUint8Arrays(mp3Data)
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)
  const result = new Uint8Array(totalLength)

  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }

  return result
}

export const encodeWAV = async (
  audioBuffer: AudioBuffer,
): Promise<Uint8Array> => {
  const arrayBuffer = await encode({
    sampleRate: audioBuffer.sampleRate,
    channelData: [audioBuffer.getChannelData(0), audioBuffer.getChannelData(1)],
  })
  return new Uint8Array(arrayBuffer)
}
