import { flow } from "lodash"
import { map } from "../../../helpers/array"
import { timeSignatureMidiEvent } from "../../../midi"
import { TempoEventsClipboardData } from "../../clipboard/clipboardTypes"
import { TrackEvent } from "../../event/TrackEvent"
import { moveTempoEvent } from "../../tempo/transform"
import { getSetTempoEventsByIds } from "../queries"
import { TrackEventsMutator } from "../Track"
import {
  addEvent,
  combineMutators,
  createOrUpdate,
  updateEvents,
} from "./basic"

export const moveTempoEvents = (
  eventIds: number[],
  deltaTick: number,
  deltaValue: number,
  maxBPM: number,
): TrackEventsMutator =>
  flow(
    getSetTempoEventsByIds(eventIds),
    map(moveTempoEvent(deltaTick, deltaValue, maxBPM)),
    updateEvents,
  )

export const addClipboardTempoEvents = (
  data: TempoEventsClipboardData,
  tick: number,
): TrackEventsMutator =>
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
