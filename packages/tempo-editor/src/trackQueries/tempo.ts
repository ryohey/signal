import {
  isSetTempoEvent,
  TrackEventOf,
  TrackEventStore,
} from "@signal-app/core"
import { SetTempoEvent } from "midifile-ts"
import { TempoItem } from "../entities"
import { setTempoEventToTempoItem } from "../entities/tempo/transform"

const getSetTempoEvents = (
  events: TrackEventStore,
): readonly TrackEventOf<SetTempoEvent>[] =>
  events.getEvents().filter(isSetTempoEvent)

export const getTempoItems = (events: TrackEventStore): readonly TempoItem[] =>
  getSetTempoEvents(events).map(setTempoEventToTempoItem)

export const getTempoItemById =
  (id: number) =>
  (events: TrackEventStore): TempoItem | undefined => {
    const event = events.getEventById(id)
    if (event === undefined || !isSetTempoEvent(event)) {
      return undefined
    }

    return setTempoEventToTempoItem(event)
  }
