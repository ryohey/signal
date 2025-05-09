import { Player, SoundFontSynth } from "@signal-app/player"
import { isRunningInElectron } from "../helpers/platform"
import { EventSource } from "../player/EventSource"
import { GroupOutput } from "../services/GroupOutput"
import { MIDIInput, previewMidiInput } from "../services/MIDIInput"
import { MIDIRecorder } from "../services/MIDIRecorder"
import { UNASSIGNED_TRACK_ID } from "../track"
import { SerializedArrangeViewStore } from "./ArrangeViewStore"
import { SerializedControlStore } from "./ControlStore"
import { MIDIDeviceStore } from "./MIDIDeviceStore"
import PianoRollStore, { SerializedPianoRollStore } from "./PianoRollStore"
import { registerReactions } from "./reactions"
import RootViewStore from "./RootViewStore"
import { SongStore } from "./SongStore"
import { SoundFontStore } from "./SoundFontStore"
import TempoEditorStore from "./TempoEditorStore"
import { TrackMuteStore } from "./TrackMuteStore"

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
  readonly trackMuteStore = new TrackMuteStore()
  readonly rootViewStore = new RootViewStore()
  readonly pianoRollStore: PianoRollStore
  readonly tempoEditorStore: TempoEditorStore
  readonly midiDeviceStore = new MIDIDeviceStore()
  readonly player: Player
  readonly synth: SoundFontSynth
  readonly metronomeSynth: SoundFontSynth
  readonly synthGroup: GroupOutput
  readonly midiInput = new MIDIInput()
  readonly midiRecorder: MIDIRecorder
  readonly soundFontStore: SoundFontStore

  constructor() {
    const context = new (window.AudioContext || window.webkitAudioContext)()
    this.synth = new SoundFontSynth(context)
    this.metronomeSynth = new SoundFontSynth(context)
    this.synthGroup = new GroupOutput(this.trackMuteStore, this.metronomeSynth)
    this.synthGroup.outputs.push({ synth: this.synth, isEnabled: true })

    const eventSource = new EventSource(this.songStore)
    this.player = new Player(this.synthGroup, eventSource)

    this.pianoRollStore = new PianoRollStore(this.songStore, this.player)
    this.tempoEditorStore = new TempoEditorStore(this.songStore, this.player)
    this.soundFontStore = new SoundFontStore(this.synth)

    this.midiRecorder = new MIDIRecorder(
      this.songStore,
      this.player,
      this.pianoRollStore,
    )

    const preview = previewMidiInput(this)

    this.midiInput.onMidiMessage = (e) => {
      preview(e)
      this.midiRecorder.onMessage(e)
    }

    this.pianoRollStore.setUpAutorun()
    this.tempoEditorStore.setUpAutorun()

    registerReactions(this)
  }

  async init() {
    // Select the first track that is not a conductor track
    this.pianoRollStore.selectedTrackId =
      this.songStore.song.tracks.find((t) => !t.isConductorTrack)?.id ??
      UNASSIGNED_TRACK_ID

    await this.synth.setup()
    await this.soundFontStore.init()
    this.setupMetronomeSynth()
  }

  private async setupMetronomeSynth() {
    const data = await loadMetronomeSoundFontData()
    await this.metronomeSynth.loadSoundFont(data)
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
