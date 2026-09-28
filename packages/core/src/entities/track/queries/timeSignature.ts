import { isTimeSignatureEvent } from "../../event"
import { TrackEventsQuery } from "./type"

export const hasTimeSignatureAt =
  (tick: number): TrackEventsQuery<boolean> =>
  (track) =>
    track
      .getArray()
      .filter(isTimeSignatureEvent)
      .some((e) => e.tick === tick)
