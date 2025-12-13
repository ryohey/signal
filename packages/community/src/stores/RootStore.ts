import {
  createCloudSongDataRepository,
  createCloudSongRepository,
  createUserRepository,
} from "@signal-app/api"
import { Player, SoundFontSynth } from "@signal-app/player"
import { auth, firestore } from "../firebase/firebase.js"
import { EventSource } from "../services/EventSource.js"
import { AuthStore } from "./AuthStore.js"
import { CommunitySongStore } from "./CommunitySongStore.js"
import RootViewStore from "./RootViewStore.js"
import { SongStore } from "./SongStore.js"

export default class RootStore {
  readonly userRepository = createUserRepository(firestore, auth)
  readonly cloudSongRepository = createCloudSongRepository(firestore, auth)
  readonly cloudSongDataRepository = createCloudSongDataRepository(
    firestore,
    auth
  )
  readonly songStore = new SongStore(this.cloudSongDataRepository)
  readonly authStore = new AuthStore(this.userRepository)
  readonly communitySongStore = new CommunitySongStore()
  readonly rootViewStore = new RootViewStore()
  readonly player: Player
  readonly synth: SoundFontSynth

  constructor() {
    const context = new (window.AudioContext || window.webkitAudioContext)()
    this.synth = new SoundFontSynth(context)
    const eventSource = new EventSource(this.songStore)
    this.player = new Player(this.synth, eventSource)
  }
}
