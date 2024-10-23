import {
  createCloudMidiRepository,
  createCloudSongDataRepository,
  createCloudSongRepository,
  createUserRepository,
} from "@signal-app/api"
import { Player, SoundFontSynth } from "@signal-app/player"
import { makeObservable, observable } from "mobx"
import { deserialize, serialize } from "serializr"
import { auth, firestore, functions } from ".././firebase/firebase"
import { pushHistory } from "../actions/history"
import { isRunningInElectron } from "../helpers/platform"
import { EventSource } from "../player/EventSource"
import { GroupOutput } from "../services/GroupOutput"
import { MIDIInput, previewMidiInput } from "../services/MIDIInput"
import { MIDIRecorder } from "../services/MIDIRecorder"
import Song, { emptySong } from "../song"
import { UNASSIGNED_TRACK_ID } from "../track"
import TrackMute from "../trackMute"
import ArrangeViewStore, {
  SerializedArrangeViewStore,
} from "./ArrangeViewStore"
import { AuthStore } from "./AuthStore"
import { CloudFileStore } from "./CloudFileStore"
import { ControlStore, SerializedControlStore } from "./ControlStore"
import { ExportStore } from "./ExportStore"
import HistoryStore from "./HistoryStore"
import { MIDIDeviceStore } from "./MIDIDeviceStore"
import PianoRollStore, { SerializedPianoRollStore } from "./PianoRollStore"
import { registerReactions } from "./reactions"
import RootViewStore from "./RootViewStore"
import Router from "./Router"
import SettingStore from "./SettingStore"
import { SoundFontStore } from "./SoundFontStore"
import TempoEditorStore from "./TempoEditorStore"
import { ThemeStore } from "./ThemeStore"

// we use any for now. related: https://github.com/Microsoft/TypeScript/issues/1897
type Json = any

export interface SerializedRootStore {
  song: Json
  pianoRollStore: SerializedPianoRollStore
  controlStore: SerializedControlStore
  arrangeViewStore: SerializedArrangeViewStore
}

export default class RootStore {
  song: Song = emptySong()

  readonly cloudSongRepository = createCloudSongRepository(firestore, auth)
  readonly cloudSongDataRepository = createCloudSongDataRepository(
    firestore,
    auth,
  )
  readonly cloudMidiRepository = createCloudMidiRepository(firestore, functions)
  readonly userRepository = createUserRepository(firestore, auth)

  readonly router = new Router()
  readonly trackMute = new TrackMute()
  readonly historyStore = new HistoryStore<SerializedRootStore>()
  readonly rootViewStore = new RootViewStore()
  readonly pianoRollStore: PianoRollStore
  readonly controlStore: ControlStore
  readonly arrangeViewStore = new ArrangeViewStore(this)
  readonly tempoEditorStore = new TempoEditorStore(this)
  readonly midiDeviceStore = new MIDIDeviceStore()
  readonly exportStore = new ExportStore()
  readonly authStore = new AuthStore(this.userRepository)
  readonly cloudFileStore = new CloudFileStore(
    this,
    this.cloudSongRepository,
    this.cloudSongDataRepository,
  )
  readonly settingStore = new SettingStore()
  readonly player: Player
  readonly synth: SoundFontSynth
  readonly metronomeSynth: SoundFontSynth
  readonly synthGroup: GroupOutput
  readonly midiInput = new MIDIInput()
  readonly midiRecorder: MIDIRecorder
  readonly soundFontStore: SoundFontStore
  readonly themeStore = new ThemeStore()

  constructor() {
    makeObservable(this, {
      song: observable.ref,
    })

    const context = new (window.AudioContext || window.webkitAudioContext)()
    this.synth = new SoundFontSynth(context)
    this.metronomeSynth = new SoundFontSynth(context)
    this.synthGroup = new GroupOutput(this.trackMute, this.metronomeSynth)
    this.synthGroup.outputs.push({ synth: this.synth, isEnabled: true })

    const eventSource = new EventSource(this)
    this.player = new Player(this.synthGroup, eventSource)
    this.midiRecorder = new MIDIRecorder(this.player, this)

    this.pianoRollStore = new PianoRollStore(this)
    this.controlStore = new ControlStore(this.pianoRollStore)
    this.soundFontStore = new SoundFontStore(this.synth)

    const preview = previewMidiInput(this)

    this.midiInput.onMessage = (e) => {
      preview(e)
      this.midiRecorder.onMessage(e)
    }

    this.pianoRollStore.setUpAutorun()
    this.arrangeViewStore.setUpAutorun()
    this.tempoEditorStore.setUpAutorun()

    registerReactions(this)
  }

  serialize(): SerializedRootStore {
    return {
      song: serialize(this.song),
      pianoRollStore: this.pianoRollStore.serialize(),
      controlStore: this.controlStore.serialize(),
      arrangeViewStore: this.arrangeViewStore.serialize(),
    }
  }

  restore(serializedState: SerializedRootStore) {
    const song = deserialize(Song, serializedState.song)
    this.song = song
    this.pianoRollStore.restore(serializedState.pianoRollStore)
    this.controlStore.restore(serializedState.controlStore)
    this.arrangeViewStore.restore(serializedState.arrangeViewStore)
  }

  async init() {
    // Select the first track that is not a conductor track
    this.pianoRollStore.selectedTrackId =
      this.song.tracks.find((t) => !t.isConductorTrack)?.id ??
      UNASSIGNED_TRACK_ID

    await this.synth.setup()
    await this.soundFontStore.init()
    this.setupMetronomeSynth()
  }

  private async setupMetronomeSynth() {
    const data = await loadMetronomeSoundFontData()
    await this.metronomeSynth.loadSoundFont(data)
  }

  get pushHistory() {
    return pushHistory(this)
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
