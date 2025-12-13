import { SynthEvent } from "@ryohey/wavelet"
import { SoundFont } from "./SoundFont.js"
import { SendableEvent, SynthOutput } from "./SynthOutput.js"

export class SoundFontSynth implements SynthOutput {
  private synth: AudioWorkletNode | null = null

  // Reverb effect nodes
  private convolver: ConvolverNode | null = null
  private dryGain: GainNode | null = null
  private wetGain: GainNode | null = null
  private _reverbMix: number = 0.2 // 20% wet by default

  private _loadedSoundFont: SoundFont | null = null
  get loadedSoundFont(): SoundFont | null {
    return this._loadedSoundFont
  }

  get isLoaded(): boolean {
    return this._loadedSoundFont !== null
  }

  /** Whether the synth is ready to play audio (SoundFont loaded and AudioContext running) */
  get isReady(): boolean {
    return (
      this.synth !== null &&
      this._loadedSoundFont !== null &&
      this.context.state === "running"
    )
  }

  get reverbMix(): number {
    return this._reverbMix
  }

  private sequenceNumber = 0

  constructor(private readonly context: AudioContext) {}

  /**
   * Creates a synthetic impulse response for reverb effect.
   * This simulates a medium-sized hall with ~2 second decay.
   */
  private createImpulseResponse(
    duration: number = 2.0,
    decay: number = 2.0,
  ): AudioBuffer {
    const sampleRate = this.context.sampleRate
    const length = sampleRate * duration
    const impulse = this.context.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        // Exponential decay with random noise
        channelData[i] =
          (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
      }
    }
    return impulse
  }

  /**
   * Sets up the reverb effect chain.
   * Call this after the synth node is created.
   */
  private setupReverb() {
    // Create nodes
    this.convolver = this.context.createConvolver()
    this.dryGain = this.context.createGain()
    this.wetGain = this.context.createGain()

    // Load impulse response
    this.convolver.buffer = this.createImpulseResponse()

    // Set initial mix levels
    this.setReverbMix(this._reverbMix)
  }

  /**
   * Sets the reverb wet/dry mix.
   * @param mix 0.0 = fully dry (no reverb), 1.0 = fully wet (all reverb)
   */
  setReverbMix(mix: number) {
    this._reverbMix = Math.max(0, Math.min(1, mix))
    if (this.dryGain && this.wetGain) {
      this.dryGain.gain.value = 1 - this._reverbMix
      this.wetGain.gain.value = this._reverbMix
    }
  }

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

    // Set up reverb effect chain
    this.setupReverb()

    // Connect synth through reverb chain:
    // synth → dryGain → destination (clean signal)
    // synth → convolver → wetGain → destination (reverb signal)
    if (this.dryGain && this.wetGain && this.convolver) {
      this.synth.connect(this.dryGain)
      this.synth.connect(this.convolver)
      this.dryGain.connect(this.context.destination)
      this.convolver.connect(this.wetGain)
      this.wetGain.connect(this.context.destination)
    } else {
      // Fallback: direct connection if reverb setup failed
      this.synth.connect(this.context.destination)
    }

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
    if (this.synth === null) {
      console.warn(
        "SoundFontSynth: Cannot send message - synth not initialized. SoundFont may not be loaded.",
      )
      return
    }
    this.synth.port.postMessage(
      { ...e, sequenceNumber: this.sequenceNumber++ },
      transfer ?? [],
    )
  }

  sendEvent(event: SendableEvent, delayTime: number = 0) {
    if (this.context.state !== "running") {
      console.warn(
        `SoundFontSynth: AudioContext state is "${this.context.state}", not "running". Audio may not play.`,
      )
    }
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
