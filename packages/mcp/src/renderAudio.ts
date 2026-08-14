import { readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Mp3Encoder } from "@breezystack/lamejs"
import {
  audioToWav,
  BasicMIDI,
  SoundBankLoader,
  SpessaSynthProcessor,
  SpessaSynthSequencer,
} from "spessasynth_core"

const packageDirectory = dirname(fileURLToPath(import.meta.url))
export const defaultSoundFontPath = resolve(
  packageDirectory,
  "../../../electron/assets/soundfonts/A320U.sf2",
)

const exactArrayBuffer = (bytes: Uint8Array) =>
  bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer

const floatToInt16 = (samples: Float32Array, start: number, length: number) => {
  const output = new Int16Array(length)
  for (let index = 0; index < length; index++) {
    const sample = Math.max(-1, Math.min(1, samples[start + index] ?? 0))
    output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }
  return output
}

const encodeMp3 = (
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  bitrateKbps: number,
) => {
  const encoder = new Mp3Encoder(2, sampleRate, bitrateKbps)
  const chunks: Buffer[] = []
  const blockSize = 1152
  for (let offset = 0; offset < left.length; offset += blockSize) {
    const length = Math.min(blockSize, left.length - offset)
    const encoded = encoder.encodeBuffer(
      floatToInt16(left, offset, length),
      floatToInt16(right, offset, length),
    )
    if (encoded.length > 0) {
      chunks.push(
        Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength),
      )
    }
  }
  const finalChunk = encoder.flush()
  if (finalChunk.length > 0) {
    chunks.push(
      Buffer.from(
        finalChunk.buffer,
        finalChunk.byteOffset,
        finalChunk.byteLength,
      ),
    )
  }
  return Buffer.concat(chunks)
}

export type RenderAudioOptions = {
  filePath: string
  format: "mp3" | "wav"
  soundFontPath?: string
  durationSeconds?: number
  sampleRate?: 22050 | 44100 | 48000
  bitrateKbps?: 96 | 128 | 192 | 256 | 320
}

export const renderMidiAudio = async (
  midiBytes: Uint8Array,
  options: RenderAudioOptions,
) => {
  const sampleRate = options.sampleRate ?? 44100
  const bitrateKbps = options.bitrateKbps ?? 128
  const midi = BasicMIDI.fromArrayBuffer(exactArrayBuffer(midiBytes))
  const requestedDuration = options.durationSeconds ?? midi.duration + 2
  if (
    !Number.isFinite(requestedDuration) ||
    requestedDuration <= 0 ||
    requestedDuration > 3600
  ) {
    throw new Error("durationSeconds must be between 0 and 3600")
  }

  const soundFontPath = resolve(options.soundFontPath ?? defaultSoundFontPath)
  const soundFontBytes = await readFile(soundFontPath)
  const soundBank = SoundBankLoader.fromArrayBuffer(
    exactArrayBuffer(soundFontBytes),
  )
  const synth = new SpessaSynthProcessor(sampleRate, { eventsEnabled: false })
  synth.soundBankManager.addSoundBank(soundBank, "main")
  await synth.processorInitialized
  synth.setSystemParameter("autoAllocateVoices", true)

  const sequencer = new SpessaSynthSequencer(synth)
  sequencer.skipToFirstNoteOn = false
  sequencer.loadNewSongList([midi])
  sequencer.play()

  const sampleCount = Math.ceil(sampleRate * requestedDuration)
  const left = new Float32Array(sampleCount)
  const right = new Float32Array(sampleCount)
  const renderBlockSize = 128
  for (let offset = 0; offset < sampleCount; offset += renderBlockSize) {
    sequencer.processTick()
    synth.process(
      left,
      right,
      offset,
      Math.min(renderBlockSize, sampleCount - offset),
    )
  }

  const outputPath = resolve(options.filePath)
  const encoded =
    options.format === "mp3"
      ? encodeMp3(left, right, sampleRate, bitrateKbps)
      : new Uint8Array(audioToWav([left, right], sampleRate))
  await writeFile(outputPath, encoded)
  return {
    filePath: outputPath,
    format: options.format,
    durationSeconds: sampleCount / sampleRate,
    sampleRate,
    bitrateKbps: options.format === "mp3" ? bitrateKbps : undefined,
    soundFontPath,
    byteLength: encoded.byteLength,
  }
}
