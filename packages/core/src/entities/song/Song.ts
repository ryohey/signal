import {
  combineSubscription,
  Emitter,
  Observable,
  ObservableValue,
  switchSubscription,
} from "@signal-app/observable"
import {
  createModelSchema,
  deserialize,
  list,
  object,
  primitive,
  serialize,
} from "serializr"
import { Measure } from "../measure/Measure"
import { Track, TrackId } from "../track"
import { collectAllEvents } from "./collectAllEvents"

const END_MARGIN = 480 * 30
const DEFAULT_TIME_BASE = 480

export class Song {
  private readonly _tracks = new ObservableValue<readonly Track[]>([])
  private readonly _conductorTrack = new ObservableValue<Track | undefined>(
    undefined,
  )
  private _tracksSnapshot: Track[] = []
  private readonly _filepath = new ObservableValue<string>("")
  private readonly _timebase = new ObservableValue<number>(DEFAULT_TIME_BASE)
  private readonly _name = new ObservableValue<string>("")
  fileHandle: FileSystemFileHandle | null = null
  private readonly _cloudSongId = new ObservableValue<string | null>(null)
  cloudSongDataId: string | null = null
  private readonly _isSaved = new ObservableValue<boolean>(true)

  private lastTrackId = 0
  private readonly _measures = new ObservableValue<Measure[]>([])
  private readonly _onEndOfSongChanged = new Emitter()

  private unsubscribeSubscriptions: (() => void) | null = null

  constructor() {
    this.setupSubscriptions()
  }

  private setupSubscriptions() {
    this.unsubscribeSubscriptions?.()

    const subscriptions = [
      // when name, tracks, or timebase changes, mark the song as unsaved
      combineSubscription([
        this.onNameChanged.subscribe,
        this.onTracksChanged.subscribe,
        this.onTimebaseChanged.subscribe,
        switchSubscription(this.onTracksChanged.subscribe, () =>
          combineSubscription(
            this.tracks.map((track) => track.onChanged.subscribe),
          ),
        ),
      ])(() => {
        this._isSaved.set(false)
      }),
      // when tracks change, update the snapshot
      this.onTracksChanged.subscribe(() => {
        this._tracksSnapshot = [...this.tracks]
        this.refreshConductorTrack()
      }),
      // when timebase or conductor track changes, update measures
      combineSubscription([
        this.onTimebaseChanged.subscribe,
        this.onConductorTrackChanged.subscribe,
        switchSubscription(
          this.onConductorTrackChanged.subscribe,
          () => this.conductorTrack?.onTimeSignatureEventsChanged.subscribe,
        ),
      ])(() => {
        this.updateMeasures()
      }),
      // when each track's endOfTrack changes, update endOfSong
      switchSubscription(this.onTracksChanged.subscribe, () =>
        combineSubscription(
          this.tracks.map((track) => track.onEndOfTrackChanged.subscribe),
        ),
      )(() => {
        this._onEndOfSongChanged.emit()
      }),
      // when each track's isConductorTrack changes, refresh conductor track
      switchSubscription(this.onTracksChanged.subscribe, () =>
        combineSubscription(
          this.tracks.map((track) => track.onIsConductorTrackChanged.subscribe),
        ),
      )(() => {
        this.refreshConductorTrack()
      }),
    ]

    this.unsubscribeSubscriptions = () => {
      subscriptions.forEach((unsubscribe) => unsubscribe())
    }

    this._tracksSnapshot = [...this.tracks]
    this.refreshConductorTrack()
  }

  private updateMeasures() {
    const timeSignatures = this.conductorTrack?.timeSignatureEvents ?? []
    this._measures.set(
      Measure.fromTimeSignatures(timeSignatures, this.timebase),
    )
  }

  private refreshConductorTrack() {
    this._conductorTrack.set(this.tracks.find((t) => t.isConductorTrack))
  }

  private afterDeserialize() {
    this._tracksSnapshot = [...this.tracks]
    this.setupSubscriptions()
  }

  private generateTrackId(): TrackId {
    return this.lastTrackId++ as TrackId
  }

  insertTrack(t: Track, index: number) {
    // 最初のトラックは Conductor Track なので channel を設定しない
    if (t.channel === undefined && this.tracks.length > 0) {
      t.channel = t.channel || this.tracks.length - 1
    }
    t.id = this.generateTrackId()
    const tracks = [...this.tracks]
    tracks.splice(index, 0, t)
    this.tracks = tracks
  }

  addTrack(t: Track) {
    this.insertTrack(t, this.tracks.length)
  }

  removeTrack(id: TrackId) {
    this.tracks = this.tracks.filter((t) => t.id !== id)
  }

  moveTrack(from: number, to: number) {
    const tracks = [...this.tracks]
    const [track] = tracks.splice(from, 1)
    tracks.splice(to, 0, track)
    this.tracks = tracks
  }

  get tracks(): readonly Track[] {
    return this._tracks.value
  }

  private set tracks(value: readonly Track[]) {
    this._tracks.set(value)
  }

  get onTracksChanged(): Observable {
    return this._tracks.onChanged
  }

  get conductorTrack(): Track | undefined {
    return this._conductorTrack.value
  }

  get onConductorTrackChanged(): Observable {
    return this._conductorTrack.onChanged
  }

  get name(): string {
    return this._name.value
  }

  set name(value: string) {
    this._name.set(value)
  }

  get onNameChanged(): Observable {
    return this._name.onChanged
  }

  get timebase(): number {
    return this._timebase.value
  }

  set timebase(value: number) {
    this._timebase.set(value)
  }

  get onTimebaseChanged(): Observable {
    return this._timebase.onChanged
  }

  get filepath(): string {
    return this._filepath.value
  }

  set filepath(value: string) {
    this._filepath.set(value)
  }

  get onFilepathChanged(): Observable {
    return this._filepath.onChanged
  }

  get isSaved(): boolean {
    return this._isSaved.value
  }

  set isSaved(value: boolean) {
    this._isSaved.set(value)
  }

  get onIsSavedChanged(): Observable {
    return this._isSaved.onChanged
  }

  get cloudSongId(): string | null {
    return this._cloudSongId.value
  }

  set cloudSongId(value: string | null) {
    this._cloudSongId.set(value)
  }

  get onCloudSongIdChanged(): Observable {
    return this._cloudSongId.onChanged
  }

  get onMeasuresChanged(): Observable {
    return this._measures.onChanged
  }

  getTrack(id: TrackId): Track | undefined {
    return this.tracks.find((t) => t.id === id)
  }

  getTracksSnapshot = (): readonly Track[] => {
    return this._tracksSnapshot
  }

  get measures(): Measure[] {
    return this._measures.value
  }

  get endOfSong(): number {
    const eos = Math.max(...this.tracks.map((t) => t.endOfTrack))
    return (eos ?? 0) + END_MARGIN
  }

  get onEndOfSongChanged(): Observable {
    return this._onEndOfSongChanged
  }

  updateEndOfSong() {
    this.tracks.forEach((t) => t.updateEndOfTrack())
  }

  get allEvents() {
    return collectAllEvents(this.tracks)
  }

  serialize() {
    return serialize(this)
  }

  // biome-ignore lint/suspicious/noExplicitAny: We need to accept any JSON object here
  static deserialize(json: any): Song {
    const song = deserialize(Song, json)
    song.afterDeserialize()
    song.tracks.forEach((t) => t.afterDeserialize())
    return song
  }
}

createModelSchema(Song, {
  tracks: list(object(Track)),
  name: primitive(),
  filepath: primitive(),
  timebase: primitive(),
  lastTrackId: primitive(),
  isSaved: primitive(),
})
