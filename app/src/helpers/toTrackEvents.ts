import { AnyEvent } from "midifile-ts"
import {
  AnyEventFeature,
  DeltaTimeProvider,
  isSequencerSpecificEvent,
  TickProvider,
  TrackEvent,
} from "../track"
import { mapToSignalEvent } from "../track/signalEvents"
import { DistributiveOmit } from "../types"
import { assemble as assembleNotes } from "./noteAssembler"

export function addTick<T extends DeltaTimeProvider>(
  events: T[],
): (DistributiveOmit<T, "deltaTime"> & TickProvider)[] {
  let tick = 0
  return events.map((e) => {
    const { deltaTime, ...rest } = e
    tick += deltaTime
    return {
      ...(rest as DistributiveOmit<T, "deltaTime">),
      tick,
    }
  })
}

export const removeUnnecessaryProps = <T>(e: T): T => {
  const { channel, ...ev } = e as any
  return ev
}

export const isSupportedEvent = (e: AnyEventFeature): boolean =>
  !(e.type === "meta" && e.subtype === "endOfTrack")

const toSignalEvent = (e: TrackEvent): TrackEvent => {
  if (isSequencerSpecificEvent(e)) {
    return mapToSignalEvent(e)
  }
  return e
}

export function toTrackEvents(events: AnyEvent[]): TrackEvent[] {
  const tickedEvents: (DistributiveOmit<AnyEvent, "deltaTime"> &
    TickProvider)[] = addTick(events.filter(isSupportedEvent))
  const trackEvents = assembleNotes(tickedEvents).map(
    removeUnnecessaryProps,
  ) as unknown as TrackEvent[]
  return trackEvents.map(toSignalEvent)
}

// toTrackEvents without addTick
export function tickedEventsToTrackEvents(
  events: (DistributiveOmit<AnyEvent, "deltaTime"> & TickProvider)[],
): TrackEvent[] {
  const trackEvents = assembleNotes(events.filter(isSupportedEvent)).map(
    removeUnnecessaryProps,
  ) as unknown as TrackEvent[]
  return trackEvents.map(toSignalEvent)
}
