import { isEqual } from "lodash"
import type { SequencerSpecificEvent } from "midifile-ts"
import type { DistributiveOmit } from "../../types"
import type { TrackColor } from "./TrackColor"
import type { TrackEvent, TrackEventOf } from "./TrackEvent"

/**
 * Stores track color information, etc.
 * as sequencer-specific events referring to PreSonus StudioOne.
 *
 * The data part starts with the first 4 characters of Signal as a prefix.
 * The next 1 byte is the event type that defined as SignalEventType, and the rest is the data body of any size.
 */

// 'S' 'i' 'g' 'n'
const signalEventPrefix = "Sign".split("").map((c) => c.charCodeAt(0))

enum SignalEventType {
  preserved = 0,
  trackColor = 1,
}

export type SignalEvent<T extends string> = {
  id: number
  tick: number
  type: "channel"
  subtype: "signal"
  signalEventType: T
}

export type SignalTrackColorEvent = SignalEvent<"trackColor"> & TrackColor

export type AnySignalEvent = SignalTrackColorEvent

export const isSignalEvent = (
  e: DistributiveOmit<TrackEvent, "tick" | "id">
): e is AnySignalEvent => "subtype" in e && e.subtype === "signal"

export const isSignalTrackColorEvent = (
  e: TrackEvent
): e is SignalTrackColorEvent =>
  isSignalEvent(e) && e.signalEventType === "trackColor"

export const mapToSignalEvent = <
  T extends Pick<SequencerSpecificEvent, "data">,
>(
  e: T
): AnySignalEvent | T => {
  if (e.data.length <= 5 || !isEqual(e.data.slice(0, 4), signalEventPrefix)) {
    return e
  }

  switch (e.data[4]) {
    case SignalEventType.trackColor:
      // 'S' 'i' 'g' 'n' 0x01 A B G R
      if (e.data.length !== 9) {
        return e
      }
      return {
        ...e,
        subtype: "signal",
        signalEventType: "trackColor",
        alpha: e.data[5],
        blue: e.data[6],
        green: e.data[7],
        red: e.data[8],
      }
    default:
      return e
  }
}

export const mapFromSignalEvent = (
  e: AnySignalEvent
): TrackEventOf<SequencerSpecificEvent> => {
  switch (e.signalEventType) {
    case "trackColor":
      // 'S' 'i' 'g' 'n' 0x01 A B G R
      return {
        id: e.id,
        tick: e.tick,
        type: "meta",
        subtype: "sequencerSpecific",
        data: [
          ...signalEventPrefix,
          SignalEventType.trackColor,
          e.alpha,
          e.blue,
          e.green,
          e.red,
        ],
      }
  }
}
