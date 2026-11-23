import {
  BluetoothMIDIDeviceStore,
  MIDIDeviceStore,
  MIDIInput,
  SongStore,
} from "@signal-app/core"
import { Player, SoundFont, SoundFontSynth } from "@signal-app/player"
import { isRunningInElectron } from "../helpers/platform"
import { EventSource } from "../player/EventSource"
import { AutoSaveService } from "../services/AutoSaveService"
import { GroupOutput } from "../services/GroupOutput"
import { MIDIMonitor } from "../services/MIDIMonitor"
import { MIDIRecorder } from "../services/MIDIRecorder"
import {
  loadSampleRate,
  loadSynthesizerParameters,
  saveSampleRate,
} from "../services/synthesizerSettings"
import { registerReactions } from "./reactions"

export default class RootStore {
  readonly songStore = new SongStore()
  readonly midiDeviceStore: MIDIDeviceStore
  readonly player: Player
  readonly synth: SoundFontSynth
  readonly metronomeSynth: SoundFontSynth
  readonly synthGroup: GroupOutput
  readonly midiInput: MIDIInput
  readonly midiRecorder: MIDIRecorder
  readonly midiMonitor: MIDIMonitor
  readonly bluetoothMIDIDeviceStore: BluetoothMIDIDeviceStore
  readonly autoSaveService: AutoSaveService
  // The rate picked in the settings, or null for the device rate. It only
  // changes with a reload, since a running AudioContext can't change its rate.
  private _sampleRate = loadSampleRate()

  constructor() {
    let context: AudioContext
    try {
      context = createAudioContext(this._sampleRate)
    } catch (e) {
      const isUnsupported =
        e instanceof DOMException && e.name === "NotSupportedError"
      if (this._sampleRate === null || !isUnsupported) {
        throw e
      }
      // A stored rate the browser doesn't support would otherwise break the whole app
      console.warn(
        `Unsupported sample rate ${this._sampleRate}, using default`,
        e,
      )
      context = createAudioContext(null)
      // Only forget the choice once the default rate actually works
      this._sampleRate = null
      saveSampleRate(null)
    }
    this.synth = new SoundFontSynth(context)
    this.synth.setSystemParameters(loadSynthesizerParameters())
    this.metronomeSynth = new SoundFontSynth(context)
    this.synthGroup = new GroupOutput(this.metronomeSynth)
    this.synthGroup.outputs.push({ synth: this.synth, isEnabled: true })

    const eventSource = new EventSource(this.songStore)
    this.player = new Player(this.synthGroup, eventSource)

    this.midiDeviceStore = new MIDIDeviceStore()
    this.midiInput = new MIDIInput(this.midiDeviceStore)
    this.bluetoothMIDIDeviceStore = new BluetoothMIDIDeviceStore(this.midiInput)
    this.midiRecorder = new MIDIRecorder(
      this.songStore,
      this.player,
      this.midiDeviceStore,
      this.midiInput,
    )
    this.midiMonitor = new MIDIMonitor(this.player, this.midiDeviceStore)

    this.midiInput.on("midiMessage", (e) => {
      this.midiMonitor.onMessage(e)
    })

    this.autoSaveService = new AutoSaveService(this.songStore)

    registerReactions(this)
  }

  async init() {
    await this.synth.setup()
    this.setupMetronomeSynth()
    this.autoSaveService.startAutoSave()
    this.bluetoothMIDIDeviceStore.autoConnect()
  }

  public get sampleRate() {
    return this._sampleRate
  }

  private async setupMetronomeSynth() {
    const data = await loadMetronomeSoundFontData()
    await this.metronomeSynth.loadSoundFont(await SoundFont.load(data))
  }
}

function createAudioContext(sampleRate: number | null) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  return sampleRate === null
    ? new AudioContextClass()
    : new AudioContextClass({ sampleRate })
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
