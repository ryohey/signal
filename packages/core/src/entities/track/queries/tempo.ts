import { flow, min } from "lodash"
import { SetTempoEvent } from "midifile-ts"
import { filter, isEventInRange, map } from "../../../helpers"
import { TempoEventsClipboardData } from "../../clipboard/clipboardTypes"
import { isSetTempoEvent, TrackEventOf } from "../../event"
import { Range } from "../../geometry/Range"
import { getEventsByIds, TrackEventsQuery } from "./basic"

export const getSetTempoEventsByIds = (
  ids: readonly number[],
): TrackEventsQuery<readonly TrackEventOf<SetTempoEvent>[]> =>
  flow(getEventsByIds(ids), filter(isSetTempoEvent))

export const getSetTempoEventIdsInRange = (
  range: Range,
): TrackEventsQuery<readonly number[]> =>
  flow(
    filter(isSetTempoEvent),
    filter(isEventInRange(range)),
    map((e) => e.id),
  )

export const tempoEventsToClipboardData =
  (
    eventIds: readonly number[],
  ): TrackEventsQuery<TempoEventsClipboardData | null> =>
  (events) => {
    const tempoEvents = getSetTempoEventsByIds(eventIds)(events)

    const minTick = min(tempoEvents.map((e) => e.tick))

    if (minTick === undefined) {
      return null
    }

    return {
      type: "tempo_events",
      events: tempoEvents.map((e) => ({ ...e, tick: e.tick - minTick })),
    }
  }
