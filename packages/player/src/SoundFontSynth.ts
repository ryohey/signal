import { WorkletSynthesizer } from "spessasynth_lib"
import { SoundFont } from "./SoundFont.js"
import { SendableEvent, SynthOutput } from "./SynthOutput.js"

export class SoundFontSynth implements SynthOutput {
  private synth: WorkletSynthesizer | null = null

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

  constructor(private readonly context: AudioContext) {}

  async setup() {
    // Load the spessasynth worklet processor from public folder
    await this.context.audioWorklet.addModule("/spessasynth_processor.min.js")
  }

  async loadSoundFont(soundFont: SoundFont) {
    if (this.synth !== null) {
      this.synth.destroy()
    }

    // Create new WorkletSynthesizer with reverb/chorus disabled for cleaner sound
    // These can be re-enabled later if needed by changing the config
    this.synth = new WorkletSynthesizer(this.context, {
      initializeReverbProcessor: false,
      initializeChorusProcessor: false,
    })

    // Connect to destination
    this.synth.connect(this.context.destination)

    this._loadedSoundFont = soundFont

    // Load the soundfont data
    await this.synth.soundBankManager.addSoundBank(soundFont.data, "main")
  }

  sendEvent(event: SendableEvent, delayTime: number = 0) {
    if (this.synth === null) {
      console.warn(
        "SoundFontSynth: Cannot send event - synth not initialized. SoundFont may not be loaded.",
      )
      return
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
        this.synth.programChange(channel, event.programNumber)
        break
      case "controller":
        this.synth.controllerChange(channel, event.controllerType, event.value)
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
}
