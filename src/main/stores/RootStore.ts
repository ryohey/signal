import { makeObservable, observable } from "mobx"
import Player from "../../common/player"
import Song, { emptySong } from "../../common/song"
import TrackMute from "../../common/trackMute"
import { SerializedState } from "../actions/history"
import { GroupOutput } from "../services/GroupOutput"
import { MIDIInput, previewMidiInput } from "../services/MIDIInput"
import { MIDIRecorder } from "../services/MIDIRecorder"
import { SoundFontSynth } from "../services/SoundFontSynth"
import ArrangeViewStore from "./ArrangeViewStore"
import { AuthStore } from "./AuthStore"
import { CloudFileStore } from "./CloudFileStore"
import { ExportStore } from "./ExportStore"
import HistoryStore from "./HistoryStore"
import { MIDIDeviceStore } from "./MIDIDeviceStore"
import PianoRollStore from "./PianoRollStore"
import RootViewStore from "./RootViewStore"
import Router from "./Router"
import SettingStore from "./SettingStore"
import TempoEditorStore from "./TempoEditorStore"
import { registerReactions } from "./reactions"

export default class RootStore {
  song: Song = emptySong()
  readonly router = new Router()
  readonly trackMute = new TrackMute()
  readonly historyStore = new HistoryStore<SerializedState>()
  readonly rootViewStore = new RootViewStore()
  readonly pianoRollStore: PianoRollStore
  readonly arrangeViewStore = new ArrangeViewStore(this)
  readonly tempoEditorStore = new TempoEditorStore(this)
  readonly midiDeviceStore = new MIDIDeviceStore()
  readonly exportStore = new ExportStore()
  readonly authStore = new AuthStore()
  readonly cloudFileStore = new CloudFileStore()
  readonly settingStore = new SettingStore()
  readonly player: Player
  readonly synth: SoundFontSynth
  readonly synthGroup = new GroupOutput()
  readonly midiInput = new MIDIInput()
  readonly midiRecorder: MIDIRecorder

  constructor() {
    makeObservable(this, {
      song: observable.ref,
    })

    const context = new (window.AudioContext || window.webkitAudioContext)()
    // this.synth = new SoundFontSynth(context, "/FluidR3_GM.sf2")
    // this.synth = new SoundFontSynth(context, "/SGM-V2.01.sf2")
    // this.synth = new SoundFontSynth(context, "/winxp.sf2")
    this.synth = new SoundFontSynth(context, "/TimGM6mb.sf2")
    // this.synth = new SoundFontSynth(context, "/gm.sf2")


    // this.synth = new SoundFontSynth(context, "/A320U.sf2")
    const metronomeSynth = new SoundFontSynth(context, "/A320U_drums.sf2")
    this.synthGroup.outputs.push({ synth: this.synth, isEnabled: true })

    this.player = new Player(
      this.synthGroup,
      metronomeSynth,
      this.trackMute,
      this
    )
    this.midiRecorder = new MIDIRecorder(this.player, this)

    this.pianoRollStore = new PianoRollStore(this)

    const preview = previewMidiInput(this)

    this.midiInput.onMidiMessage = (e) => {
      preview(e)
      this.midiRecorder.onMessage(e)
    }

    this.pianoRollStore.setUpAutorun()
    this.arrangeViewStore.setUpAutorun()
    this.tempoEditorStore.setUpAutorun()

    registerReactions(this)
  }
}
