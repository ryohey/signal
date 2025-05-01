import { PlayerEvent } from "@signal-app/player"
import { action, computed, makeObservable, observable, reaction } from "mobx"
import { createModelSchema, list, object, primitive } from "serializr"
import { Measure } from "../entities/measure/Measure"
import { NoteNumber } from "../entities/unit/NoteNumber"
import { isNotNull } from "../helpers/array"
import { collectAllEvents } from "../player/collectAllEvents"
import Track, { isNoteEvent, isTimeSignatureEvent, TrackId } from "../track"

const END_MARGIN = 480 * 30
const DEFAULT_TIME_BASE = 480

export default class Song {
  tracks: Track[] = []
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
      tracks: observable.shallow,
      filepath: observable,
      timebase: observable,
      name: observable,
      isSaved: observable,
    })

    reaction(
      () => [
        this.tracks.map((t) => ({ channel: t.channel, events: t.events })),
        this.name,
      ],
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
    this.tracks.splice(index, 0, t)
  }

  addTrack(t: Track) {
    this.insertTrack(t, this.tracks.length)
  }

  removeTrack(id: TrackId) {
    this.tracks = this.tracks.filter((t) => t.id !== id)
  }

  moveTrack(from: number, to: number) {
    const [track] = this.tracks.splice(from, 1)
    this.tracks.splice(to, 0, track)
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

  transposeNotes(
    deltaPitch: number,
    selectedEventIds: {
      [key: number]: number[] // trackIndex: eventId
    },
  ) {
    for (const trackIndexStr in selectedEventIds) {
      const trackIndex = parseInt(trackIndexStr)
      const eventIds = selectedEventIds[trackIndex]
      const track = this.tracks[trackIndex]
      if (track === undefined) {
        continue
      }
      track.updateEvents(
        eventIds
          .map((id) => {
            const n = track.getEventById(id)
            if (n == undefined || !isNoteEvent(n)) {
              return null
            }
            return {
              id,
              noteNumber: NoteNumber.clamp(n.noteNumber + deltaPitch),
            }
          })
          .filter(isNotNull),
      )
    }
  }
}

createModelSchema(Song, {
  tracks: list(object(Track)),
  filepath: primitive(),
  timebase: primitive(),
  lastTrackId: primitive(),
})
