import { isEqual } from "lodash"
import { SequencerSpecificEvent } from "midifile-ts"
import { TrackColor } from "./TrackColor"
import { TrackEvent, TrackEventOf } from "./TrackEvent"

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

type SignalEvent<T extends string> = {
  type: "channel"
  subtype: "signal"
  signalEventType: T
}

export type SignalTrackColorEvent = SignalEvent<"trackColor"> & TrackColor

export type AnySignalEvent = SignalTrackColorEvent

// extract the value type of SignalEvent
type SignalEventValueOf<T extends AnySignalEvent> = Omit<
  T,
  "type" | "subtype" | "signalEventType"
>

export const isSignalEvent = (
  e: TrackEvent,
): e is TrackEventOf<AnySignalEvent> => "subtype" in e && e.subtype === "signal"

const identifySignalEvent =
  <T extends AnySignalEvent>(signalEventType: T["signalEventType"]) =>
  (e: TrackEvent): e is TrackEventOf<T> =>
    isSignalEvent(e) && e.signalEventType === signalEventType

export const isSignalTrackColorEvent = identifySignalEvent("trackColor")

const signalEventToSequencerSpecificEvent =
  <T extends AnySignalEvent>(toData: (e: TrackEventOf<T>) => number[]) =>
  (e: TrackEventOf<T>): TrackEventOf<SequencerSpecificEvent> => {
    return {
      id: e.id,
      tick: e.tick,
      type: "meta",
      subtype: "sequencerSpecific",
      data: [
        ...signalEventPrefix,
        SignalEventType[e.signalEventType],
        ...toData(e),
      ],
    }
  }

const sequencerSpecificEventToSignalEvent =
  <T extends AnySignalEvent>(
    size: number,
    fromData: (data: number[]) => SignalEventValueOf<T>,
  ) =>
  (e: TrackEventOf<SequencerSpecificEvent>): TrackEventOf<T> | undefined => {
    if (e.data.length - 5 !== size) {
      return undefined
    }
    const signalEvent = {
      type: "channel",
      subtype: "signal",
      signalEventType: SignalEventType[e.data[4]] as T["signalEventType"],
      ...fromData(e.data.slice(5)),
    } as T
    return {
      ...signalEvent,
      id: e.id,
      tick: e.tick,
    } as unknown as TrackEventOf<T>
  }

const createConverter = <T extends AnySignalEvent>(
  dataSize: number,
  fromData: (data: number[]) => SignalEventValueOf<T>,
  toData: (e: TrackEventOf<T>) => number[],
) => ({
  fromSequencerSpecificEvent: sequencerSpecificEventToSignalEvent<T>(
    dataSize,
    fromData,
  ),
  toSequencerSpecificEvent: signalEventToSequencerSpecificEvent<T>(toData),
})

// 'S' 'i' 'g' 'n' 0x01 A B G R
const signalTrackColorConverter = createConverter(
  4,
  (data) => ({
    alpha: data[0],
    blue: data[1],
    green: data[2],
    red: data[3],
  }),
  (e) => [e.alpha, e.blue, e.green, e.red],
)

export const mapToSignalEvent = (
  e: TrackEventOf<SequencerSpecificEvent>,
): TrackEventOf<AnySignalEvent> | TrackEventOf<SequencerSpecificEvent> => {
  if (e.data.length <= 5 || !isEqual(e.data.slice(0, 4), signalEventPrefix)) {
    return e
  }

  switch (e.data[4]) {
    case SignalEventType.trackColor:
      return signalTrackColorConverter.fromSequencerSpecificEvent(e) ?? e
    default:
      return e
  }
}

export const mapFromSignalEvent = (
  e: TrackEventOf<AnySignalEvent>,
): TrackEventOf<SequencerSpecificEvent> => {
  switch (e.signalEventType) {
    case "trackColor":
      return signalTrackColorConverter.toSequencerSpecificEvent(e)
  }
}
