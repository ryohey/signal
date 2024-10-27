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
  inputChannel = 2,
}

type SignalEvent<T extends string> = TrackEventOf<{
  type: "channel"
  subtype: "signal"
  signalEventType: T
}>

export type SignalTrackColorEvent = SignalEvent<"trackColor"> & TrackColor

export type SignalInputChannelEvent = SignalEvent<"inputChannel"> & {
  value: number
}

export type AnySignalEvent = SignalTrackColorEvent | SignalInputChannelEvent

// extract the value type of SignalEvent
type SignalEventValueOf<T extends AnySignalEvent> = Omit<
  T,
  "id" | "tick" | "type" | "subtype" | "signalEventType"
>

export const isSignalEvent = (e: TrackEvent): e is AnySignalEvent =>
  "subtype" in e && e.subtype === "signal"

const identifySignalEvent =
  <T extends AnySignalEvent>(signalEventType: T["signalEventType"]) =>
  (e: TrackEvent): e is T =>
    isSignalEvent(e) && e.signalEventType === signalEventType

const signalEventToSequencerSpecificEvent =
  <T extends AnySignalEvent>(toData: (e: T) => number[]) =>
  (e: T): TrackEventOf<SequencerSpecificEvent> => {
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
  (e: TrackEventOf<SequencerSpecificEvent>): T | undefined => {
    if (e.data.length - 5 !== size) {
      return undefined
    }
    return {
      type: "channel",
      subtype: "signal",
      signalEventType: SignalEventType[e.data[4]] as T["signalEventType"],
      id: e.id,
      tick: e.tick,
      ...fromData(e.data.slice(5)),
    } as T
  }

const createConverter = <T extends AnySignalEvent>(
  dataSize: number,
  fromData: (data: number[]) => SignalEventValueOf<T>,
  toData: (e: T) => number[],
) => ({
  fromSequencerSpecificEvent: sequencerSpecificEventToSignalEvent<T>(
    dataSize,
    fromData,
  ),
  toSequencerSpecificEvent: signalEventToSequencerSpecificEvent<T>(toData),
})

// MARK: - Converters

// 'S' 'i' 'g' 'n' 0x01 A B G R
const trackColorEventConverter = createConverter<SignalTrackColorEvent>(
  4,
  (data) => ({
    alpha: data[0],
    blue: data[1],
    green: data[2],
    red: data[3],
  }),
  (e) => [e.alpha, e.blue, e.green, e.red],
)

export const isSignalTrackColorEvent =
  identifySignalEvent<SignalTrackColorEvent>("trackColor")

// 'S' 'i' 'g' 'n' 0x02 <Value>
const inputChannelEventConverter = createConverter<SignalInputChannelEvent>(
  1,
  (data) => ({ value: data[0] }),
  (e) => [e.value],
)

export const isSignalInputChannelEvent =
  identifySignalEvent<SignalInputChannelEvent>("inputChannel")

// MARK: - Mapping

export const mapToSignalEvent = (
  e: TrackEventOf<SequencerSpecificEvent>,
): AnySignalEvent | TrackEventOf<SequencerSpecificEvent> => {
  if (e.data.length <= 5 || !isEqual(e.data.slice(0, 4), signalEventPrefix)) {
    return e
  }

  switch (e.data[4]) {
    case SignalEventType.trackColor:
      return trackColorEventConverter.fromSequencerSpecificEvent(e) ?? e
    case SignalEventType.inputChannel:
      return inputChannelEventConverter.fromSequencerSpecificEvent(e) ?? e
    default:
      return e
  }
}

export const mapFromSignalEvent = (
  e: AnySignalEvent,
): TrackEventOf<SequencerSpecificEvent> => {
  switch (e.signalEventType) {
    case "trackColor":
      return trackColorEventConverter.toSequencerSpecificEvent(e)
    case "inputChannel":
      return inputChannelEventConverter.toSequencerSpecificEvent(e)
  }
}
