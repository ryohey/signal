import {
  filter,
  getAll,
  getEventById,
  isSetTempoEvent,
  TrackEventOf,
  TrackEventsQuery,
} from "@signal-app/core"
import { flow } from "lodash"
import { SetTempoEvent } from "midifile-ts"
import { TempoItem } from "../entities"
import { setTempoEventToTempoItem } from "../entities/tempo/transform"

const getSetTempoEvents: TrackEventsQuery<
  readonly TrackEventOf<SetTempoEvent>[]
> = flow(getAll, filter(isSetTempoEvent))

export const getTempoItems: TrackEventsQuery<readonly TempoItem[]> = (events) =>
  getSetTempoEvents(events).map(setTempoEventToTempoItem)

export const getTempoItemById =
  (id: number): TrackEventsQuery<TempoItem | undefined> =>
  (events) => {
    const event = getEventById(id)(events)
    if (event === undefined || !isSetTempoEvent(event)) {
      return undefined
    }

    return setTempoEventToTempoItem(event)
  }
