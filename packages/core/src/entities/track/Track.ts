import {
  combineSubscription,
  Emitter,
  Observable,
  ObservableValue,
  Unsubscribe,
} from "@signal-app/observable"
import { TimeSignatureEvent } from "midifile-ts"
import {
  deserializeTickOrderedArray,
  TickOrderedArray,
} from "../../data/OrdererdArray/TickOrderedArray"
import { Branded } from "../../types"
import {
  isNoteEvent,
  isProgramChangeEvent,
  isSetTempoEvent,
  isTimeSignatureEvent,
  isTrackNameEvent,
} from "./identify"
import { getTrackNameEvent } from "./selector"
import { isSignalTrackColorEvent, SignalTrackColorEvent } from "./signalEvents"
import { TrackColor } from "./TrackColor"
import { TrackEvent, TrackEventOf } from "./TrackEvent"
import { TrackEvents } from "./TrackEvents"

export type TrackId = Branded<number, "TrackId">
export const UNASSIGNED_TRACK_ID = -1 as TrackId

type SerializedTrack = {
  id?: TrackId
  _events?: unknown
  channel?: number
  endOfTrack?: number
}

export class Track {
  private readonly _id = new ObservableValue<TrackId>(UNASSIGNED_TRACK_ID)
  private _events = new TickOrderedArray<TrackEvent>()
  private _eventsSnapshot: TrackEvent[] = []
  private readonly _name = new ObservableValue<string | undefined>(undefined)
  private readonly _color = new ObservableValue<
    SignalTrackColorEvent | undefined
  >(undefined)
  private readonly _timeSignatureEvents = new ObservableValue<
    TrackEventOf<TimeSignatureEvent>[]
  >([])
  private readonly _endOfTrack = new ObservableValue<number>(0)
  private readonly _channel = new ObservableValue<number | undefined>(undefined)

  getEventById = (id: number): TrackEvent | undefined => this._events.get(id)

  private readonly _onEventsChanged = new Emitter()
  private readonly _onProgramChangeEventsChanged = new Emitter()
  private readonly _onSetTempoEventsChanged = new Emitter()
  private readonly _onIsRhythmTrackChanged = new Emitter()
  private readonly _onIsConductorTrackChanged = new Emitter()
  private readonly _onChanged: Observable

  private unsubscribeReaction: Unsubscribe | null = null

  constructor() {
    this._onChanged = {
      subscribe: combineSubscription([
        this._id.onChanged.subscribe,
        this._channel.onChanged.subscribe,
        this._onEventsChanged.subscribe,
      ]),
    }
    this.setupReactions()
  }

  private setupReactions() {
    this.unsubscribeReaction?.()
    this.unsubscribeReaction = this._events.onChange.subscribe((change) => {
      this._eventsSnapshot = [...this._events.getArray()]

      const changedEvents = ("added" in change ? change.added : []).concat(
        "removed" in change ? change.removed : [],
      )
      this._onEventsChanged.emit()
      this.didEventsChanged(changedEvents)
    })
  }

  private didEventsChanged = (changedEvents: readonly TrackEvent[]) => {
    if (
      this._onProgramChangeEventsChanged.listenerCount > 0 &&
      changedEvents.some(isProgramChangeEvent)
    ) {
      this._onProgramChangeEventsChanged.emit()
    }
    if (
      this._onSetTempoEventsChanged.listenerCount > 0 &&
      changedEvents.some(isSetTempoEvent)
    ) {
      this._onSetTempoEventsChanged.emit()
    }
    if (changedEvents.some(isTrackNameEvent)) {
      const nextName = getTrackNameEvent(this.events)?.text
      this._name.set(nextName)
    }
    if (changedEvents.some(isSignalTrackColorEvent)) {
      const nextColor = TrackEvents.getColorEvent(this.events)
      this._color.set(nextColor)
    }
    if (changedEvents.some(isTimeSignatureEvent)) {
      this._timeSignatureEvents.set(this.events.filter(isTimeSignatureEvent))
    }
  }

  afterDeserialize() {
    this._eventsSnapshot = [...this.events]
    this.didEventsChanged(this.events)
    this.setupReactions()
  }

  get onProgramChangeEventsChanged() {
    return this._onProgramChangeEventsChanged
  }

  get onChanged(): Observable {
    return this._onChanged
  }

  get onIdChanged(): Observable {
    return this._id.onChanged
  }

  get onIsRhythmTrackChanged(): Observable {
    return this._onIsRhythmTrackChanged
  }

  get onIsConductorTrackChanged(): Observable {
    return this._onIsConductorTrackChanged
  }

  get onChannelChanged(): Observable {
    return this._channel.onChanged
  }

  get onEndOfTrackChanged(): Observable {
    return this._endOfTrack.onChanged
  }

  get onSetTempoEventsChanged() {
    return this._onSetTempoEventsChanged
  }

  get onTimeSignatureEventsChanged() {
    return this._timeSignatureEvents.onChanged
  }

  get onNameChanged() {
    return this._name.onChanged
  }

  get onColorChanged() {
    return this._color.onChanged
  }

  get onEventsChanged() {
    return this._onEventsChanged
  }

  get timeSignatureEvents() {
    return this._timeSignatureEvents.value
  }

  get events(): readonly TrackEvent[] {
    return this._events.getArray()
  }

  get endOfTrack(): number {
    return this._endOfTrack.value
  }

  private set endOfTrack(value: number) {
    this._endOfTrack.set(value)
  }

  get id(): TrackId {
    return this._id.value
  }

  set id(value: TrackId) {
    this._id.set(value)
  }

  get channel(): number | undefined {
    return this._channel.value
  }

  set channel(value: number | undefined) {
    if (this._channel.value === value) {
      return
    }
    const wasRhythmTrack = this.isRhythmTrack
    const wasConductorTrack = this.isConductorTrack
    this._channel.set(value)
    if (wasRhythmTrack !== this.isRhythmTrack) {
      this._onIsRhythmTrackChanged.emit()
    }
    if (wasConductorTrack !== this.isConductorTrack) {
      this._onIsConductorTrackChanged.emit()
    }
  }

  getEventsSnapshot = (): readonly TrackEvent[] => {
    return this._eventsSnapshot
  }

  updateEvent<T extends TrackEvent>(id: number, obj: Partial<T>): T | null {
    const newObj = TrackEvents.updateEvent(id, obj)(this._events)
    if (newObj !== null) {
      this.extendEndOfTrack(newObj)
    }
    return newObj
  }

  updateEvents<T extends TrackEvent>(events: Partial<T>[]) {
    this.transaction(() => {
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
    const result = this.transaction(() => {
      const dontMoveChannelEvent = this.isConductorTrack

      return events
        .filter((e) => (dontMoveChannelEvent ? e.type !== "channel" : true))
        .map((e) => this.addEvent(e))
    })
    return result
  }

  transaction<T>(func: (track: Track) => T) {
    return this._events.transaction(() => func(this))
  }

  /* helper */

  createOrUpdate<T extends TrackEvent>(
    newEvent: Omit<T, "id"> & { subtype?: string; controllerType?: number },
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
        newEvent.tick + newEvent.duration,
      )
    }
  }

  get name() {
    return this._name.value
  }

  get color(): SignalTrackColorEvent | undefined {
    return this._color.value
  }

  setColor(color: TrackColor | null) {
    TrackEvents.setColor(color)(this._events)
  }

  setVolume(value: number, tick: number) {
    TrackEvents.setVolume(value, tick)(this._events)
  }
  setPan(value: number, tick: number) {
    TrackEvents.setPan(value, tick)(this._events)
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

  serialize() {
    return {
      id: this.id,
      _events: this._events.serialize(),
      channel: this.channel,
      endOfTrack: this.endOfTrack,
    }
  }

  static deserialize(json: unknown): Track {
    const serialized = (json ?? {}) as SerializedTrack
    const track = new Track()
    track._events = deserializeTickOrderedArray(
      serialized._events ?? {},
    ) as unknown as TickOrderedArray<TrackEvent>
    track.id = serialized.id ?? UNASSIGNED_TRACK_ID
    track.channel = serialized.channel
    track.endOfTrack = serialized.endOfTrack ?? 0
    track.afterDeserialize()
    return track
  }
}
