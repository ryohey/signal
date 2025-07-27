import { SynthEvent } from "@ryohey/wavelet"
import { SoundFont } from "./SoundFont.js"
import { SendableEvent, SynthOutput } from "./SynthOutput.js"

export class SoundFontSynth implements SynthOutput {
  private synth: AudioWorkletNode | null = null

  private _loadedSoundFont: SoundFont | null = null
  get loadedSoundFont(): SoundFont | null {
    return this._loadedSoundFont
  }

  get isLoaded(): boolean {
    return this._loadedSoundFont !== null
  }

  private sequenceNumber = 0

  constructor(private readonly context: AudioContext) {}

  async setup() {
    const url = new URL("@ryohey/wavelet/dist/processor.js", import.meta.url)
    await this.context.audioWorklet.addModule(url)
  }

  async loadSoundFont(soundFont: SoundFont) {
    if (this.synth !== null) {
      this.synth.disconnect()
    }

    // create new node
    this.synth = new AudioWorkletNode(this.context, "synth-processor", {
      numberOfInputs: 0,
      outputChannelCount: [2],
    } as any)
    this.synth.connect(this.context.destination)
    this.sequenceNumber = 0

    this._loadedSoundFont = soundFont

    for (const e of soundFont.sampleEvents) {
      this.postSynthMessage(
        e.event,
        e.transfer, // transfer instead of copy
      )
    }
  }

  private postSynthMessage(e: SynthEvent, transfer?: Transferable[]) {
    this.synth?.port.postMessage(
      { ...e, sequenceNumber: this.sequenceNumber++ },
      transfer ?? [],
    )
  }

  sendEvent(event: SendableEvent, delayTime: number = 0) {
    this.postSynthMessage({
      type: "midi",
      midi: event,
      delayTime: delayTime * this.context.sampleRate,
    })
  }

  activate() {
    this.context.resume()
  }
}
