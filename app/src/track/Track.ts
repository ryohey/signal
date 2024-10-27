import isEqual from "lodash/isEqual"
import omit from "lodash/omit"
import sortBy from "lodash/sortBy"
import {
  ControllerEvent,
  ProgramChangeEvent,
  SetTempoEvent,
  TrackNameEvent,
} from "midifile-ts"
import { action, computed, makeObservable, observable, transaction } from "mobx"
import { createModelSchema, list, primitive } from "serializr"
import { bpmToUSecPerBeat } from "../helpers/bpm"
import { pojo } from "../helpers/pojo"
import {
  programChangeMidiEvent,
  setTempoMidiEvent,
  trackNameMidiEvent,
} from "../midi/MidiEvent"
import { Branded } from "../types"
import { isControllerEventWithType, isNoteEvent } from "./identify"
import {
  getLast,
  getPan,
  getProgramNumberEvent,
  getTempo,
  getTempoEvent,
  getTimeSignatureEvent,
  getTrackNameEvent,
  getVolume,
  isTickBefore,
} from "./selector"
import {
  createSignalInputChannelEvent,
  createSignalTrackColorEvent,
  isSignalInputChannelEvent,
  isSignalTrackColorEvent,
  SignalInputChannelEvent,
  SignalTrackColorEvent,
} from "./signalEvents"
import { TrackColor } from "./TrackColor"
import { TrackEvent, TrackEventOf } from "./TrackEvent"
import { validateMidiEvent } from "./validate"

export type TrackId = Branded<number, "TrackId">
export const UNASSIGNED_TRACK_ID = -1 as TrackId

export default class Track {
  id: TrackId = UNASSIGNED_TRACK_ID
  events: TrackEvent[] = []
  channel: number | undefined = undefined

  private lastEventId = 0

  getEventById = (id: number): TrackEvent | undefined =>
    this.events.find((e) => e.id === id)

  constructor() {
    makeObservable(this, {
      updateEvent: action,
      updateEvents: action,
      removeEvent: action,
      removeEvents: action,
      addEvent: action,
      addEvents: action,
      sortByTick: action,
      name: computed,
      endOfTrack: computed,
      programNumber: computed,
      isConductorTrack: computed,
      isRhythmTrack: computed,
      color: computed,
      id: observable,
      events: observable.shallow,
      channel: observable,
    })
  }

  private _updateEvent<T extends TrackEvent>(
    id: number,
    obj: Partial<T>,
  ): T | null {
    const index = this.events.findIndex((e) => e.id === id)
    if (index < 0) {
      console.warn(`unknown id: ${id}`)
      return null
    }
    const anObj = this.events[index] as T
    const newObj = { ...anObj, ...obj }
    if (isEqual(newObj, anObj)) {
      return null
    }
    this.events[index] = newObj

    if (process.env.NODE_ENV !== "production") {
      validateMidiEvent(newObj)
    }

    return newObj
  }

  updateEvent<T extends TrackEvent>(id: number, obj: Partial<T>): T | null {
    const result = this._updateEvent(id, obj)
    if (result) {
      this.sortByTick()
    }
    return result
  }

  updateEvents<T extends TrackEvent>(events: Partial<T>[]) {
    transaction(() => {
      events.forEach((event) => {
        if (event.id === undefined) {
          return
        }
        this._updateEvent(event.id, event)
      })
    })
    this.sortByTick()
  }

  removeEvent(id: number) {
    this.removeEvents([id])
  }

  removeEvents(ids: number[]) {
    this.events = this.events.filter((e) => !ids.includes(e.id))
  }

  // ソート、通知を行わない内部用の addEvent
  // add the event without sorting, notification
  private _addEvent<T extends TrackEvent>(
    e: Omit<T, "id"> & { subtype?: string },
  ): T {
    if (!("tick" in e) || isNaN(e.tick)) {
      throw new Error("invalid event is added")
    }
    if ("subtype" in e && e.subtype === "endOfTrack") {
      throw new Error("endOfTrack event is added")
    }
    const newEvent = {
      ...omit(e, ["deltaTime", "channel"]),
      id: this.lastEventId++,
    } as T
    this.events.push(newEvent)
    return newEvent
  }

  addEvent<T extends TrackEvent>(e: Omit<T, "id">): T {
    const ev = this._addEvent(e)
    this.didAddEvent()
    return ev
  }

  addEvents<T extends TrackEvent>(events: Omit<T, "id">[]): T[] {
    const result = transaction(() => {
      const dontMoveChannelEvent = this.isConductorTrack

      return events
        .filter((e) => (dontMoveChannelEvent ? e.type !== "channel" : true))
        .map((e) => this._addEvent(e))
    })
    this.didAddEvent()
    return result
  }

  didAddEvent() {
    this.sortByTick()
  }

  sortByTick() {
    this.events = sortBy(this.events, "tick")
  }

  transaction<T>(func: (track: Track) => T) {
    return transaction(() => func(this))
  }

  /* helper */

  private getRedundantEvents<T extends TrackEvent>(
    event: Omit<T, "id"> & { subtype?: string; controllerType?: number },
  ) {
    return this.events.filter(
      (e) =>
        e.type === event.type &&
        e.tick === event.tick &&
        ("subtype" in e && "subtype" in event
          ? e.subtype === event.subtype
          : true) &&
        ("controllerType" in e && "controllerType" in event
          ? e.controllerType === event.controllerType
          : true),
    )
  }

  createOrUpdate<T extends TrackEvent>(
    newEvent: Omit<T, "id"> & { subtype?: string; controllerType?: number },
  ): T {
    const events = this.getRedundantEvents(newEvent)

    if (events.length > 0) {
      this.transaction((it) => {
        events.forEach((e) => {
          it.updateEvent(e.id, { ...newEvent, id: e.id } as Partial<T>)
        })
      })
      return events[0] as T
    } else {
      return this.addEvent(newEvent)
    }
  }

  removeRedundantEvents<T extends TrackEvent>(
    event: T & { subtype?: string; controllerType?: number },
  ) {
    this.removeEvents(
      this.getRedundantEvents(event)
        .filter((e) => e.id !== event.id)
        .map((e) => e.id),
    )
  }

  private setControllerValue = (
    controllerType: number,
    tick: number,
    value: number,
  ) => {
    const e = getLast(
      this.events
        .filter(isControllerEventWithType(controllerType))
        .filter(isTickBefore(tick)),
    )
    if (e !== undefined) {
      this.updateEvent<TrackEventOf<ControllerEvent>>(e.id, {
        value,
      })
    } else {
      // If there are no controller events, we insert new event at the head of the track
      this.addEvent<TrackEventOf<ControllerEvent>>({
        type: "channel",
        subtype: "controller",
        controllerType,
        tick: 0,
        value,
      })
    }
  }

  get name() {
    return getTrackNameEvent(this.events)?.text
  }
  get programNumber() {
    return getProgramNumberEvent(this.events)?.value
  }
  get endOfTrack() {
    let maxTick = 0
    // Use for loop instead of map/filter to avoid the error `Maximum call stack size exceeded`
    for (const e of this.events) {
      const tick = isNoteEvent(e) ? e.tick + e.duration : e.tick
      maxTick = Math.max(maxTick, tick)
    }
    return maxTick
  }

  get color(): SignalTrackColorEvent | undefined {
    return this.events.filter(isSignalTrackColorEvent)[0]
  }

  setColor(color: TrackColor | null) {
    if (color === null) {
      const e = this.color
      if (e !== undefined) {
        this.removeEvent(e.id)
      }
      return
    }
    const e = this.color
    if (e !== undefined) {
      this.updateEvent<SignalTrackColorEvent>(e.id, color)
    } else {
      this.addEvent(createSignalTrackColorEvent(0, 0, color))
    }
  }

  get inputChannel(): SignalInputChannelEvent | undefined {
    return this.events.filter(isSignalInputChannelEvent)[0]
  }

  setInputChannel(value: number | null) {
    if (value === null) {
      const e = this.inputChannel
      if (e !== undefined) {
        this.removeEvent(e.id)
      }
      return
    }
    const e = this.inputChannel
    if (e !== undefined) {
      this.updateEvent<SignalInputChannelEvent>(e.id, { value })
    } else {
      this.addEvent(createSignalInputChannelEvent(0, 0, { value }))
    }
  }

  getPan = (tick: number) => getPan(this.events, tick)
  getVolume = (tick: number) => getVolume(this.events, tick)
  getTempo = (tick: number) => getTempo(this.events, tick)
  getTimeSignatureEvent = (tick: number) =>
    getTimeSignatureEvent(this.events, tick)

  setVolume = (value: number, tick: number) =>
    this.setControllerValue(7, tick, value)

  setPan = (value: number, tick: number) =>
    this.setControllerValue(10, tick, value)

  setProgramNumber(value: number) {
    const e = getProgramNumberEvent(this.events)
    if (e !== undefined) {
      this.updateEvent<TrackEventOf<ProgramChangeEvent>>(e.id, { value })
    } else {
      this.addEvent<TrackEventOf<ProgramChangeEvent>>({
        ...programChangeMidiEvent(0, 0, value),
        tick: 0,
      })
    }
  }

  setTempo(bpm: number, tick: number) {
    const e = getTempoEvent(this.events, tick)
    const microsecondsPerBeat = Math.floor(bpmToUSecPerBeat(bpm))
    if (e !== undefined) {
      this.updateEvent<TrackEventOf<SetTempoEvent>>(e.id, {
        microsecondsPerBeat,
      })
    } else {
      this.addEvent<TrackEventOf<SetTempoEvent>>({
        ...setTempoMidiEvent(0, microsecondsPerBeat),
        tick: 0,
      })
    }
  }

  setName(text: string) {
    const e = getTrackNameEvent(this.events)
    if (e !== undefined) {
      this.updateEvent<TrackEventOf<TrackNameEvent>>(e.id, { text })
    } else {
      this.addEvent<TrackEventOf<TrackNameEvent>>({
        ...trackNameMidiEvent(0, text),
        tick: 0,
      })
    }
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
  events: list(pojo),
  lastEventId: primitive(),
  channel: primitive(),
})
