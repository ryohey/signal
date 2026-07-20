import { flow } from "lodash"
import { map } from "../../../helpers/array"
import { timeSignatureMidiEvent } from "../../../midi"
import { TempoEventsClipboardData } from "../../clipboard/clipboardTypes"
import { TrackEvent } from "../../event/TrackEvent"
import { moveTempoEvent } from "../../tempo/transform"
import { getSetTempoEventsByIds } from "../queries"
import { addEvent } from "./basic"
import { createOrUpdate, updateEvents } from "./composed"
import { combineMutators } from "./higherOrder"
import { TrackEventsMutator } from "./type"

export const moveTempoEvents =
  (
    eventIds: readonly number[],
    deltaTick: number,
    deltaValue: number,
    maxBPM: number,
  ): TrackEventsMutator =>
  (events) => {
    const updates = flow(
      getSetTempoEventsByIds(eventIds),
      map(moveTempoEvent(deltaTick, deltaValue, maxBPM)),
    )(events)
    return updateEvents(updates)(events)
  }

export const addClipboardTempoEvents = (
  data: TempoEventsClipboardData,
  tick: number,
): TrackEventsMutator<readonly TrackEvent[]> =>
  combineMutators(
    ...data.events
      .map((e) => ({ ...e, tick: e.tick + tick }))
      .map((e) => createOrUpdate(e)),
  )

export const addTimeSignature = (
  tick: number,
  numerator: number,
  denominator: number,
): TrackEventsMutator<TrackEvent> =>
  addEvent({
    ...timeSignatureMidiEvent(0, numerator, denominator),
    tick,
  })
