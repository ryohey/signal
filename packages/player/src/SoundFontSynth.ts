import { type MIDIController } from "spessasynth_core"
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

  private workletModuleAdded = false
  private syxBuffer: number[] = []

  constructor(private readonly context: AudioContext) {}

  async setup() {
    if (this.workletModuleAdded) {
      return
    }
    this.workletModuleAdded = true
    const url = new URL("spessasynth_lib/dist/spessasynth_processor.min.js", import.meta.url)
    await this.context.audioWorklet.addModule(url)
  }

  async loadSoundFont(soundFont: SoundFont) {
    // Init synth if needed
    if (this.synth === null) {
      this.synth = new WorkletSynthesizer(this.context)
      this.synth.connect(this.context.destination)
    }
    
    await this.synth.soundBankManager.addSoundBank(
      soundFont.data.slice(0),
      "main",
    )
    this._loadedSoundFont = soundFont
    await this.synth.isReady
  }

  private handleSysExEvent(
    e: SendableEvent & { type: "sysEx" | "dividedSysEx" },
    eventTime: number,
  ) {
    if (this.synth === null) return
    
    if (e.type === "sysEx")
      this.syxBuffer = []
    this.syxBuffer.push(...e.data)
    const buf = this.syxBuffer
    if (buf.length > 0 && buf[buf.length - 1] === 0xf7) {
      this.synth.systemExclusive(buf, 0, { time: eventTime })
      this.syxBuffer = []
    }
  }

  private postSynthMessage(e: SendableEvent, eventTime: number) {
    if (this.synth === null)
      return
    
    // Handle sysex separately
    if (e.type === "sysEx" || e.type === "dividedSysEx") {
      this.handleSysExEvent(e, eventTime)
      return
    }
    
    if (e.type !== "channel")
      return
    
    const ch = e.channel
    const opts = { time: eventTime }
    switch (e.subtype) {
      case "noteOn":
        this.synth.noteOn(ch, e.noteNumber, e.velocity, opts)
        break
      
      case "noteOff":
        this.synth.noteOff(ch, e.noteNumber,  opts)
        break
      
      case "channelAftertouch":
        this.synth.channelPressure(ch, e.amount, opts)
        break
      
      case "controller":
        this.synth.controllerChange(
          ch,
          e.controllerType as MIDIController,
          e.value,
          opts,
        )
        break
      
      case "noteAftertouch":
        this.synth.polyPressure(ch, e.noteNumber, e.amount, opts)
        break
      
      case "pitchBend":
        this.synth.pitchWheel(ch, e.value, opts)
        break
      
      case "programChange":
        this.synth.programChange(ch, e.value, opts);
        break
    }
  }

  sendEvent(
    event: SendableEvent,
    delayTime: number = 0,
    _timestampNow: number = performance.now(),
    _trackId?: number,
  ) {
    if(!this.synth) return;
    const eventTime = this.synth.currentTime + delayTime
    this.postSynthMessage(event, eventTime)
  }

  activate() {
    this.context.resume()
  }
}
