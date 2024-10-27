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

export const createSignalEvent = <T extends AnySignalEvent>(
  id: number,
  tick: number,
  signalEventType: T["signalEventType"],
  data: SignalEventValueOf<T>,
): T =>
  ({
    ...data,
    id,
    tick,
    type: "channel",
    subtype: "signal",
    signalEventType,
  }) as T

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
    return createSignalEvent(
      e.id,
      e.tick,
      SignalEventType[e.data[4]] as T["signalEventType"],
      fromData(e.data.slice(5)),
    )
  }

const createConverter = <T extends AnySignalEvent>(
  signalEventType: T["signalEventType"],
  dataSize: number,
  fromData: (data: number[]) => SignalEventValueOf<T>,
  toData: (e: T) => number[],
) => ({
  create: (id: number, tick: number, data: SignalEventValueOf<T>) =>
    createSignalEvent(id, tick, signalEventType, data),
  identify: identifySignalEvent<T>(signalEventType),
  fromSequencerSpecificEvent: sequencerSpecificEventToSignalEvent<T>(
    dataSize,
    fromData,
  ),
  toSequencerSpecificEvent: signalEventToSequencerSpecificEvent<T>(toData),
})

// MARK: - Converters

// 'S' 'i' 'g' 'n' 0x01 A B G R
const trackColorEventConverter = createConverter<SignalTrackColorEvent>(
  "trackColor",
  4,
  (data) => ({
    alpha: data[0],
    blue: data[1],
    green: data[2],
    red: data[3],
  }),
  (e) => [e.alpha, e.blue, e.green, e.red],
)

export const isSignalTrackColorEvent = trackColorEventConverter.identify
export const createSignalTrackColorEvent = trackColorEventConverter.create

// 'S' 'i' 'g' 'n' 0x02 <Value>
const inputChannelEventConverter = createConverter<SignalInputChannelEvent>(
  "inputChannel",
  1,
  (data) => ({ value: data[0] }),
  (e) => [e.value],
)

export const isSignalInputChannelEvent = inputChannelEventConverter.identify
export const createSignalInputChannelEvent = inputChannelEventConverter.create

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
