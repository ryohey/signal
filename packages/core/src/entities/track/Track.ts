import {
  combineSubscription,
  Emitter,
  type Observable,
  ObservableValue,
  type Unsubscribe,
} from "@signal-app/observable"
import { flow } from "lodash"
import type { TimeSignatureEvent } from "midifile-ts"
import {
  deserializeTickOrderedArray,
  TickOrderedArray,
} from "../../data/OrdererdArray/TickOrderedArray"
import type { Branded } from "../../types"
import {
  getColorEvent,
  getMaxTick,
  getPan,
  getProgramChangeEvent,
  getTempo,
  getTrackNameEvent,
  getVolume,
} from "../event"
import {
  isNoteEvent,
  isTimeSignatureEvent,
  isTrackNameEvent,
} from "../event/identify"
import {
  isSignalTrackColorEvent,
  type SignalTrackColorEvent,
} from "../event/signalEvents"
import type { TrackEvent, TrackEventOf } from "../event/TrackEvent"
import type { TrackEventsMutator } from "./mutations"
import * as Mutations from "./mutations"
import type { TrackEventsQuery } from "./queries"
import * as Queries from "./queries"
import type { TrackEventStore } from "./TrackEventStore"

export type TrackId = Branded<number, "TrackId">
export const UNASSIGNED_TRACK_ID = -1 as TrackId

type TrackEventPredicate = (event: TrackEvent) => boolean

type FilteredEventsObserver = {
  predicate: TrackEventPredicate
  emitter: Emitter
}

type SerializedTrack = {
  id?: TrackId
  _events?: unknown
  channel?: number
  endOfTrack?: number
}

export class Track implements TrackEventStore {
  private readonly _id = new ObservableValue<TrackId>(UNASSIGNED_TRACK_ID)
  private _events = new TickOrderedArray<TrackEvent>()
  private readonly _name = new ObservableValue<string | undefined>(undefined)
  private readonly _color = new ObservableValue<
    SignalTrackColorEvent | undefined
  >(undefined)
  private readonly _timeSignatureEvents = new ObservableValue<
    TrackEventOf<TimeSignatureEvent>[]
  >([])
  private readonly _endOfTrack = new ObservableValue<number>(0)
  private readonly _channel = new ObservableValue<number | undefined>(undefined)

  private readonly _onEventsChanged = new Emitter()
  private readonly _onIsRhythmTrackChanged = new Emitter()
  private readonly _onIsConductorTrackChanged = new Emitter()
  private readonly _onChanged: Observable
  private readonly _filteredEventsObservers = new Set<FilteredEventsObserver>()

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
      const changedEvents = ("added" in change ? change.added : []).concat(
        "removed" in change ? change.removed : [],
      )
      this._onEventsChanged.emit()
      this.didEventsChanged(changedEvents)

      // Reactively maintain endOfTrack
      if ("added" in change) {
        for (const event of change.added) {
          this.extendEndOfTrack(event)
        }
      }
    })
  }

  private didEventsChanged = (changedEvents: readonly TrackEvent[]) => {
    this.emitFilteredEventsChanged(changedEvents)

    if (changedEvents.some(isTrackNameEvent)) {
      const nextName = getTrackNameEvent(this.events)?.text
      this._name.set(nextName)
    }
    if (changedEvents.some(isSignalTrackColorEvent)) {
      const nextColor = getColorEvent(this.events)
      this._color.set(nextColor)
    }
    if (changedEvents.some(isTimeSignatureEvent)) {
      this._timeSignatureEvents.set(this.events.filter(isTimeSignatureEvent))
    }
  }

  private emitFilteredEventsChanged(changedEvents: readonly TrackEvent[]) {
    if (changedEvents.length === 0) {
      return
    }

    for (const observer of this._filteredEventsObservers) {
      if (
        observer.emitter.listenerCount > 0 &&
        changedEvents.some((event) => observer.predicate(event))
      ) {
        observer.emitter.emit()
      }
    }
  }

  afterDeserialize() {
    this.didEventsChanged(this.events)
    this.setupReactions()
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

  subscribeEventsChanged = (
    predicate: TrackEventPredicate,
    listener: () => void,
  ): Unsubscribe => {
    const emitter = new Emitter()
    const observer: FilteredEventsObserver = { predicate, emitter }
    this._filteredEventsObservers.add(observer)
    const unsubscribe = emitter.subscribe(listener)

    return () => {
      unsubscribe()
      this._filteredEventsObservers.delete(observer)
    }
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

  addEvents = <T extends TrackEvent>(events: Omit<T, "id">[]): T[] => {
    const result = this.transaction(() => {
      const dontMoveChannelEvent = this.isConductorTrack

      return events
        .filter((e) => (dontMoveChannelEvent ? e.type !== "channel" : true))
        .map((e) => this.addEvent(e))
    })
    return result
  }

  transaction = <T>(func: (track: Track) => T) => {
    return this._events.transaction(() => func(this))
  }

  private mutate = <R = void>(fn: TrackEventsMutator<R>): R => {
    return this._events.transaction(() => fn(this._events))
  }

  private query = <R>(fn: TrackEventsQuery<R>): R => {
    return fn(this._events)
  }

  /* queries */

  private bindQuery = <A extends unknown[], R>(fn: (...args: A) => R) =>
    flow(fn, this.query)

  getEvents = this.bindQuery(Queries.getAll)
  getEventById = this.bindQuery(Queries.getEventById)
  getEventsByIds = this.bindQuery(Queries.getEventsByIds)
  hasProgramChangeEventAfter = this.bindQuery(
    Queries.hasProgramChangeEventAfter,
  )
  getProgramChangeEvent = (tick: number) =>
    getProgramChangeEvent(tick)(this.events)
  getVolume = (tick: number) => getVolume(tick)(this.events)
  getPan = (tick: number) => getPan(tick)(this.events)

  /* mutations */

  private bindMutation = <A extends unknown[], R>(
    fn: (...args: A) => TrackEventsMutator<R>,
  ) => flow(fn, this.mutate)

  addEvent = this.bindMutation(Mutations.addEvent)
  updateEvent = this.bindMutation(Mutations.updateEvent)
  updateEvents = this.bindMutation(Mutations.updateEvents)
  removeEvent = this.bindMutation((id: number) => Mutations.removeEvents([id]))
  removeEvents = this.bindMutation(Mutations.removeEvents)
  createOrUpdate = this.bindMutation(Mutations.createOrUpdate)
  setColor = this.bindMutation(Mutations.setColor)
  setName = this.bindMutation(Mutations.setName)
  setProgramNumberAt = this.bindMutation(Mutations.setProgramNumberAt)
  setProgramNumberById = this.bindMutation(Mutations.setProgramNumberById)
  setPan = this.bindMutation(Mutations.setPan)
  setVolume = this.bindMutation(Mutations.setVolume)
  batchUpdateNotesVelocity = Mutations.batchUpdateNotesVelocity(this)

  /* conductor track features */

  getTempo = (tick: number) => getTempo(tick)(this.events)
  setTempo = flow(Mutations.setTempo, this.mutate)

  /* helper */

  updateEndOfTrack = () => {
    this.endOfTrack = getMaxTick(this.events)
  }

  private extendEndOfTrack = (newEvent: TrackEvent) => {
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

  get isConductorTrack() {
    return this.channel === undefined
  }

  get isRhythmTrack() {
    return this.channel === 9
  }

  clone = () => {
    const track = new Track()
    track.channel = this.channel
    track.addEvents(this.events.map((e) => ({ ...e })))
    return track
  }

  serialize = () => {
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
