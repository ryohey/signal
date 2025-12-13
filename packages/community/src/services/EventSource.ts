import type {
  IEventSource,
  PlayerEvent,
  PlayerEventOf,
  SendableEvent,
} from "@signal-app/player"
import maxBy from "lodash/maxBy.js"
import uniq from "lodash/uniq.js"
import type { AnyChannelEvent } from "midifile-ts"
import { isNotUndefined } from "../helpers/array.js"
import {
  isControllerEvent,
  isControllerEventWithType,
  isPitchBendEvent,
  isProgramChangeEvent,
  isSetTempoEvent,
} from "../song/identify.js"
import type { Song, TrackEvent } from "../song/Song.js"

export const isEventInRange =
  <T extends { tick: number }>(startTick: number, endTick: number) =>
  (e: T) =>
    e.tick >= startTick && e.tick < endTick

export class EventSource implements IEventSource {
  constructor(private readonly songProvider: { song: Song }) {}

  get timebase(): number {
    return this.songProvider.song.timebase
  }

  get endOfSong(): number {
    return this.songProvider.song.endOfSong
  }

  getEvents(startTick: number, endTick: number): PlayerEvent[] {
    return this.songProvider.song.tracks.flatMap((track) =>
      track.events.filter(isEventInRange(startTick, endTick)).map((event) => ({
        ...event,
        trackId: -1,
      }))
    )
  }

  getCurrentStateEvents(tick: number): SendableEvent[] {
    return this.songProvider.song.tracks.flatMap((t) => {
      const statusEvents = getStatusEvents(t.events, tick)
      return statusEvents.map(
        (e) =>
          ({
            ...e,
            trackId: -1,
          }) as PlayerEventOf<AnyChannelEvent>
      )
    })
  }
}

export const getLast = <T extends { tick: number }>(
  events: T[]
): T | undefined => maxBy(events, (e) => e.tick)

export const isTickBefore =
  (tick: number) =>
  <T extends { tick: number }>(e: T) =>
    e.tick <= tick

// collect events which will be retained in the synthesizer
const getStatusEvents = (events: readonly TrackEvent[], tick: number) => {
  const controlEvents = events
    .filter(isControllerEvent)
    .filter(isTickBefore(tick))
  // remove duplicated control types
  const recentControlEvents = uniq(controlEvents.map((e) => e.controllerType))
    .map((type) =>
      getLast(controlEvents.filter(isControllerEventWithType(type)))
    )
    .filter(isNotUndefined)

  const setTempo = getLast(
    events.filter(isSetTempoEvent).filter(isTickBefore(tick))
  )

  const programChange = getLast(
    events.filter(isProgramChangeEvent).filter(isTickBefore(tick))
  )

  const pitchBend = getLast(
    events.filter(isPitchBendEvent).filter(isTickBefore(tick))
  )

  return [...recentControlEvents, setTempo, programChange, pitchBend].filter(
    isNotUndefined
  )
}
