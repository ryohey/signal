import { action, computed, makeObservable, observable, transaction } from "mobx"
import { createModelSchema, object, primitive } from "serializr"
import { TickOrderedArray } from "../../data/OrdererdArray/TickOrderedArray"
import type { Branded } from "../../types"
import { isNoteEvent } from "./identify"
import {
  getPan,
  getProgramNumberEvent,
  getTempo,
  getTimeSignatureEvent,
  getTrackNameEvent,
  getVolume,
} from "./selector"
import type { SignalTrackColorEvent } from "./signalEvents"
import type { TrackColor } from "./TrackColor"
import type { TrackEvent } from "./TrackEvent"
import { TrackEvents } from "./TrackEvents"

export type TrackId = Branded<number, "TrackId">
export const UNASSIGNED_TRACK_ID = -1 as TrackId

export class Track {
  id: TrackId = UNASSIGNED_TRACK_ID
  private readonly _events = new TickOrderedArray<TrackEvent>()
  endOfTrack: number = 0
  channel: number | undefined = undefined

  getEventById = (id: number): TrackEvent | undefined => this._events.get(id)

  constructor() {
    makeObservable(this, {
      updateEvent: action,
      updateEvents: action,
      removeEvent: action,
      removeEvents: action,
      addEvent: action,
      addEvents: action,
      name: computed,
      programNumber: computed,
      isConductorTrack: computed,
      isRhythmTrack: computed,
      color: computed,
      events: computed,
      id: observable,
      channel: observable,
      endOfTrack: observable,
    })
  }

  get events(): readonly TrackEvent[] {
    return this._events.getArray()
  }

  updateEvent<T extends TrackEvent>(id: number, obj: Partial<T>): T | null {
    const newObj = TrackEvents.updateEvent(id, obj)(this._events)
    if (newObj !== null) {
      this.extendEndOfTrack(newObj)
    }
    return newObj
  }

  updateEvents<T extends TrackEvent>(events: Partial<T>[]) {
    transaction(() => {
      events.forEach((event) => {
        if (event.id === undefined) {
          return
        }
        this.updateEvent(event.id, event)
      })
    })
  }

  removeEvent(id: number) {
    this.removeEvents([id])
  }

  removeEvents(ids: number[]) {
    ids.forEach((id) => {
      this._events.remove(id)
    })
  }

  addEvent<T extends TrackEvent>(e: Omit<T, "id"> & { subtype?: string }): T {
    const newEvent = TrackEvents.addEvent(e)(this._events)
    this.extendEndOfTrack(newEvent)
    return newEvent
  }

  addEvents<T extends TrackEvent>(events: Omit<T, "id">[]): T[] {
    const result = transaction(() => {
      const dontMoveChannelEvent = this.isConductorTrack

      return events
        .filter((e) => (dontMoveChannelEvent ? e.type !== "channel" : true))
        .map((e) => this.addEvent(e))
    })
    return result
  }

  transaction<T>(func: (track: Track) => T) {
    return transaction(() => func(this))
  }

  /* helper */

  createOrUpdate<T extends TrackEvent>(
    newEvent: Omit<T, "id"> & { subtype?: string; controllerType?: number }
  ): T {
    return TrackEvents.createOrUpdate(newEvent)(this._events)
  }

  updateEndOfTrack() {
    this.endOfTrack = TrackEvents.getMaxTick(this.events)
  }

  private extendEndOfTrack(newEvent: TrackEvent) {
    if (isNoteEvent(newEvent)) {
      this.endOfTrack = Math.max(
        this.endOfTrack,
        newEvent.tick + newEvent.duration
      )
    }
  }

  get name() {
    return getTrackNameEvent(this.events)?.text
  }

  get programNumber() {
    return getProgramNumberEvent(this.events)?.value
  }

  get color(): SignalTrackColorEvent | undefined {
    return TrackEvents.getColorEvent(this.events)
  }

  setColor(color: TrackColor | null) {
    TrackEvents.setColor(color)(this._events)
  }

  getPan = (tick: number) => getPan(this.events, tick)
  getVolume = (tick: number) => getVolume(this.events, tick)
  getTempo = (tick: number) => getTempo(this.events, tick)
  getTimeSignatureEvent = (tick: number) =>
    getTimeSignatureEvent(this.events, tick)

  setVolume(value: number, tick: number) {
    TrackEvents.setVolume(value, tick)(this._events)
  }
  setPan(value: number, tick: number) {
    TrackEvents.setPan(value, tick)(this._events)
  }
  setProgramNumber(value: number) {
    TrackEvents.setProgramNumber(value)(this._events)
  }
  setTempo = (bpm: number, tick: number) => {
    TrackEvents.setTempo(bpm, tick)(this._events)
  }
  setName(text: string) {
    TrackEvents.setName(text)(this._events)
  }

  get isConductorTrack() {
    return this.channel === undefined
  }

  get isRhythmTrack() {
    return this.channel === 9
  }

  clone() {
    const track = new Track()
    track.channel = this.channel
    track.addEvents(this.events.map((e) => ({ ...e })))
    return track
  }
}

createModelSchema(Track, {
  id: primitive(),
  _events: object(TickOrderedArray),
  channel: primitive(),
  endOfTrack: primitive(),
})
