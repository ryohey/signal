import flatten from "lodash/flatten"
import { AnyEvent } from "midifile-ts"
import { DeltaTimeProvider, TickProvider, TrackEvent } from "../entities/track"
import {
  isSignalEvent,
  mapFromSignalEvent,
} from "../entities/track/signalEvents"
import { deassemble as deassembleNote } from "./noteAssembler"

// events in each tracks
export function addDeltaTime<T extends TickProvider>(
  events: T[],
): (T & DeltaTimeProvider)[] {
  let prevTick = 0
  return events
    .sort((a, b) => a.tick - b.tick)
    .map((e) => {
      const newEvent = {
        ...e,
        deltaTime: Math.round(e.tick) - Math.round(prevTick),
      }
      delete (newEvent as any).tick
      prevTick = e.tick
      return newEvent
    })
}

// convert the signal event to the normal sequencer specific event
const fromSignalEvent = (e: TrackEvent): TrackEvent => {
  if (isSignalEvent(e)) {
    return mapFromSignalEvent(e)
  }
  return e
}

export function toRawEvents(events: readonly TrackEvent[]): AnyEvent[] {
  const a = flatten(events.map(fromSignalEvent).map(deassembleNote))
  const c = addDeltaTime(a)
  return c as AnyEvent[]
}
