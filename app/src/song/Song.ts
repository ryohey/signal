import { Measure } from "@signal-app/core"
import { PlayerEvent } from "@signal-app/player"
import {
  action,
  computed,
  makeObservable,
  observable,
  reaction,
  toJS,
} from "mobx"
import { createModelSchema, list, object, primitive } from "serializr"
import { collectAllEvents } from "../player/collectAllEvents"
import Track, { isTimeSignatureEvent, TrackId } from "../track"

const END_MARGIN = 480 * 30
const DEFAULT_TIME_BASE = 480

export default class Song {
  tracks: readonly Track[] = []
  filepath: string = ""
  timebase: number = DEFAULT_TIME_BASE
  name: string = ""
  fileHandle: FileSystemFileHandle | null = null
  cloudSongId: string | null = null
  cloudSongDataId: string | null = null
  isSaved = true

  private lastTrackId = 0

  constructor() {
    makeObservable(this, {
      addTrack: action,
      removeTrack: action,
      insertTrack: action,
      conductorTrack: computed,
      measures: computed,
      timeSignatures: computed,
      endOfSong: computed,
      allEvents: computed({ keepAlive: true }),
      tracks: observable.ref,
      filepath: observable,
      timebase: observable,
      name: observable,
      isSaved: observable,
    })

    reaction(
      () => {
        return [
          this.tracks.map((t) => ({
            channel: t.channel,
            events: toJS(t.events),
          })),
          this.name,
        ]
      },
      () => (this.isSaved = false),
    )
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

  get conductorTrack(): Track | undefined {
    return this.tracks.find((t) => t.isConductorTrack)
  }

  getTrack(id: TrackId): Track | undefined {
    return this.tracks.find((t) => t.id === id)
  }

  get measures(): Measure[] {
    const { timeSignatures, timebase } = this
    return Measure.fromTimeSignatures(timeSignatures, timebase)
  }

  get timeSignatures() {
    const { conductorTrack } = this
    if (conductorTrack === undefined) {
      return []
    }
    return conductorTrack.events
      .filter(isTimeSignatureEvent)
      .slice()
      .sort((a, b) => a.tick - b.tick)
  }

  get endOfSong(): number {
    const eos = Math.max(...this.tracks.map((t) => t.endOfTrack))
    return (eos ?? 0) + END_MARGIN
  }

  updateEndOfSong() {
    this.tracks.forEach((t) => t.updateEndOfTrack())
  }

  get allEvents(): PlayerEvent[] {
    return collectAllEvents(this.tracks)
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
