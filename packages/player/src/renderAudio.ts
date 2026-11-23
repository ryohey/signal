import { BasicMIDI, type GlobalSystemParameter } from "spessasynth_core"
import { WorkletSynthesizer } from "spessasynth_lib"
import type { PlayerEvent } from "./PlayerEvent.js"
import { playerEventsToMIDI } from "./playerEventsToMidi.js"
import { applySystemParameters } from "./systemParameters.js"

export const renderAudio = async (
  soundFontData: ArrayBuffer,
  events: readonly PlayerEvent[],
  timebase: number,
  sampleRate: number,
  options: {
    cancel?: () => boolean
    waitForEventLoop?: () => Promise<void>
    onProgress?: (numFrames: number, totalFrames: number) => void
    systemParameters?: Partial<GlobalSystemParameter>
  },
): Promise<AudioBuffer> => {
  await options.waitForEventLoop?.()
  // Init midi and calculate durations
  const midi = playerEventsToMIDI(events, timebase)
  const totalSeconds = midi.duration + 2
  const sampleCount = Math.max(1, Math.ceil(totalSeconds * sampleRate))
  options.onProgress?.(0, sampleCount)

  // Init context and synth
  const offline = new OfflineAudioContext({
    numberOfChannels: 2,
    length: sampleCount,
    sampleRate,
  })
  const url = new URL(
    "spessasynth_lib/dist/spessasynth_processor.min.js",
    import.meta.url,
  )
  await offline.audioWorklet.addModule(url)

  const synth = new WorkletSynthesizer(offline, {
    eventsEnabled: false,
  })
  synth.connect(offline.destination)
  await synth.startOfflineRender({
    midiSequence: BasicMIDI.copyFrom(midi),
    loopCount: 0,
    soundBankList: [{ soundBankBuffer: soundFontData.slice(0), bankOffset: 0 }],
    sequencerOptions: {
      skipToFirstNoteOn: false,
    },
  })
  await synth.isReady
  if (options.systemParameters !== undefined) {
    // The lib says not to send anything before startOfflineRender, so the
    // parameters go after it. getSnapshot is a round trip, which makes sure
    // the processor has applied them before rendering starts. It can't hang
    // here, startOfflineRender just waited for a reply on the same port.
    // The offline render allocates voices as needed. Lowering the cap on top
    // of that makes it skip new voices, so export would lose notes.
    const { voiceCap: _voiceCap, ...parameters } = options.systemParameters
    applySystemParameters(synth, parameters)
    await synth.getSnapshot()
  }

  const progressTimer = setInterval(async () => {
    if (options.cancel?.()) {
      clearInterval(progressTimer)
    }
    options.onProgress?.(offline.currentTime * sampleRate, sampleCount)
  }, 200)

  try {
    await options.waitForEventLoop?.()
    const buffer = await offline.startRendering()
    await options.waitForEventLoop?.()
    options.onProgress?.(sampleCount, sampleCount)
    if (options.cancel?.()) {
      throw new DOMException("Audio export cancelled", "AbortError")
    }
    return buffer
  } finally {
    clearInterval(progressTimer)
    synth.destroy()
  }
}
