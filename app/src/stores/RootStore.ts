import { Player, SoundFont, SoundFontSynth } from "@signal-app/player"
import { isRunningInElectron } from "../helpers/platform"
import { EventSource } from "../player/EventSource"
import { AutoSaveService } from "../services/AutoSaveService"
import { GroupOutput } from "../services/GroupOutput"
import { MIDIInput } from "../services/MIDIInput"
import { MIDIMonitor } from "../services/MIDIMonitor"
import { MIDIRecorder } from "../services/MIDIRecorder"
import { SerializedArrangeViewStore } from "./ArrangeViewStore"
import { SerializedControlStore } from "./ControlStore"
import { MIDIDeviceStore } from "./MIDIDeviceStore"
import { SerializedPianoRollStore } from "./PianoRollStore"
import { registerReactions } from "./reactions"
import { SongStore } from "./SongStore"
import { SoundFontStore } from "./SoundFontStore"

// we use any for now. related: https://github.com/Microsoft/TypeScript/issues/1897
type Json = any

export interface SerializedRootStore {
  song: Json
  pianoRollStore: SerializedPianoRollStore
  controlStore: SerializedControlStore
  arrangeViewStore: SerializedArrangeViewStore
}

export default class RootStore {
  readonly songStore = new SongStore()
  readonly midiDeviceStore = new MIDIDeviceStore()
  readonly player: Player
  readonly synth: SoundFontSynth
  readonly metronomeSynth: SoundFontSynth
  readonly synthGroup: GroupOutput
  readonly midiInput = new MIDIInput()
  readonly midiRecorder: MIDIRecorder
  readonly midiMonitor: MIDIMonitor
  readonly soundFontStore: SoundFontStore
  readonly autoSaveService: AutoSaveService

  constructor() {
    const context = new (window.AudioContext || window.webkitAudioContext)()
    this.synth = new SoundFontSynth(context)
    this.metronomeSynth = new SoundFontSynth(context)
    this.synthGroup = new GroupOutput(this.metronomeSynth)
    this.synthGroup.outputs.push({ synth: this.synth, isEnabled: true })

    const eventSource = new EventSource(this.songStore)
    this.player = new Player(this.synthGroup, eventSource)

    this.soundFontStore = new SoundFontStore(this.synth)

    this.midiRecorder = new MIDIRecorder(this.songStore, this.player)
    this.midiMonitor = new MIDIMonitor(this.player)

    this.midiInput.on("midiMessage", (e) => {
      this.midiMonitor.onMessage(e)
      this.midiRecorder.onMessage(e)
    })

    this.autoSaveService = new AutoSaveService(this.songStore)

    registerReactions(this)
  }

  async init() {
    await this.synth.setup()
    await this.soundFontStore.init()
    this.setupMetronomeSynth()
    this.autoSaveService.startAutoSave()
  }

  private async setupMetronomeSynth() {
    const data = await loadMetronomeSoundFontData()
    await this.metronomeSynth.loadSoundFont(await SoundFont.load(data))
  }
}

async function loadMetronomeSoundFontData() {
  if (isRunningInElectron()) {
    return await window.electronAPI.readFile(
      "./assets/soundfonts/A320U_drums.sf2",
    )
  }
  const soundFontURL =
    "https://cdn.jsdelivr.net/gh/ryohey/signal@6959f35/public/A320U_drums.sf2"
  const response = await fetch(soundFontURL)
  const data = await response.arrayBuffer()
  return data
}
