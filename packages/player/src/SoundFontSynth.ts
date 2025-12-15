import { WorkletSynthesizer } from "spessasynth_lib"
import { SoundFont } from "./SoundFont.js"
import { SendableEvent, SynthOutput } from "./SynthOutput.js"

// Default send levels when effects are enabled (0-127)
const DEFAULT_REVERB_LEVEL = 40
const DEFAULT_CHORUS_LEVEL = 30

export class SoundFontSynth implements SynthOutput {
  private synth: WorkletSynthesizer | null = null
  private _effectsEnabled: boolean = false
  private _hasWarnedAboutUninitialized: boolean = false

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

  /** Whether reverb/chorus effects are enabled */
  get effectsEnabled(): boolean {
    return this._effectsEnabled
  }

  constructor(private readonly context: AudioContext) {}

  async setup() {
    // Load the spessasynth worklet processor from public folder
    await this.context.audioWorklet.addModule("/spessasynth_processor.min.js")
  }

  async loadSoundFont(soundFont: SoundFont) {
    if (this.synth !== null) {
      this.synth.destroy()
    }

    // Create new WorkletSynthesizer with reverb/chorus enabled
    this.synth = new WorkletSynthesizer(this.context, {
      initializeReverbProcessor: true,
      initializeChorusProcessor: true,
    })
    // Reset warning flag when synth is initialized
    this._hasWarnedAboutUninitialized = false

    // Connect to destination
    this.synth.connect(this.context.destination)

    this._loadedSoundFont = soundFont

    // Load the soundfont data
    await this.synth.soundBankManager.addSoundBank(soundFont.data, "main")

    // Set default reverb/chorus send levels to 0 for clean sound
    // Songs can override via CC91 (reverb) and CC93 (chorus)
    for (let ch = 0; ch < 16; ch++) {
      this.synth.controllerChange(ch, 91 as any, 0) // CC91 = Reverb send
      this.synth.controllerChange(ch, 93 as any, 0) // CC93 = Chorus send
    }
    this._effectsEnabled = false
  }

  sendEvent(event: SendableEvent, delayTime: number = 0) {
    if (this.synth === null) {
      if (!this._hasWarnedAboutUninitialized) {
        console.warn(
          "SoundFontSynth: Cannot send event - synth not initialized. SoundFont may not be loaded.",
        )
        this._hasWarnedAboutUninitialized = true
      }
      return
    }
    // Reset warning flag once synth is initialized
    if (this._hasWarnedAboutUninitialized) {
      this._hasWarnedAboutUninitialized = false
    }
    if (this.context.state !== "running") {
      console.warn(
        `SoundFontSynth: AudioContext state is "${this.context.state}", not "running". Audio may not play.`,
      )
    }

    const channel = event.channel

    // Translate MIDI events to spessasynth method calls
    switch (event.subtype) {
      case "noteOn":
        if (event.velocity === 0) {
          // velocity 0 noteOn is equivalent to noteOff
          this.synth.noteOff(channel, event.noteNumber)
        } else {
          this.synth.noteOn(channel, event.noteNumber, event.velocity)
        }
        break
      case "noteOff":
        this.synth.noteOff(channel, event.noteNumber)
        break
      case "programChange":
        this.synth.programChange(channel, event.value)
        break
      case "controller":
        this.synth.controllerChange(channel, event.controllerType as any, event.value)
        break
      case "pitchBend":
        this.synth.pitchWheel(channel, event.value)
        break
      case "channelAftertouch":
        this.synth.channelPressure(channel, event.amount)
        break
      case "noteAftertouch":
        this.synth.polyPressure(channel, event.noteNumber, event.amount)
        break
      default:
        // Log unhandled event types for debugging
        console.warn(
          `SoundFontSynth: Unhandled event subtype: ${(event as any).subtype}`,
        )
    }
  }

  activate() {
    this.context.resume()
  }

  /** Enable or disable reverb/chorus effects */
  setEffectsEnabled(enabled: boolean) {
    if (this.synth === null) {
      console.warn("SoundFontSynth: Cannot set effects - synth not initialized")
      return
    }

    this._effectsEnabled = enabled
    const reverbLevel = enabled ? DEFAULT_REVERB_LEVEL : 0
    const chorusLevel = enabled ? DEFAULT_CHORUS_LEVEL : 0

    for (let ch = 0; ch < 16; ch++) {
      this.synth.controllerChange(ch, 91 as any, reverbLevel) // CC91 = Reverb send
      this.synth.controllerChange(ch, 93 as any, chorusLevel) // CC93 = Chorus send
    }
  }

  /** Toggle reverb/chorus effects on/off */
  toggleEffects() {
    this.setEffectsEnabled(!this._effectsEnabled)
  }
}
