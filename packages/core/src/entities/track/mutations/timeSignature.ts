import { timeSignatureMidiEvent } from "../../../midi"
import { TrackEvent } from "../../event/TrackEvent"
import { addEvent } from "./primitives"
import { TrackEventsMutator } from "./type"

export const addTimeSignature = (
  tick: number,
  numerator: number,
  denominator: number,
): TrackEventsMutator<TrackEvent> =>
  addEvent({
    ...timeSignatureMidiEvent(0, numerator, denominator),
    tick,
  })
