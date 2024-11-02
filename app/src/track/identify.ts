import {
  ControllerEvent,
  EndOfTrackEvent,
  PitchBendEvent,
  ProgramChangeEvent,
  SequencerSpecificEvent,
  SetTempoEvent,
  TimeSignatureEvent,
  TrackNameEvent,
} from "midifile-ts"
import { NoteEvent, TrackEvent, TrackEventOf } from "./TrackEvent"

export const isNoteEvent = (e: TrackEvent): e is NoteEvent =>
  "subtype" in e && e.subtype === "note"

export const isTrackNameEvent = (
  e: TrackEvent,
): e is TrackEventOf<TrackNameEvent> =>
  "subtype" in e && e.subtype === "trackName"

export const isProgramChangeEvent = (
  e: TrackEvent,
): e is TrackEventOf<ProgramChangeEvent> =>
  "subtype" in e && e.subtype === "programChange"

export const isPitchBendEvent = (
  e: TrackEvent,
): e is TrackEventOf<PitchBendEvent> =>
  "subtype" in e && e.subtype === "pitchBend"

export const isEndOfTrackEvent = (
  e: TrackEvent,
): e is TrackEventOf<EndOfTrackEvent> =>
  "subtype" in e && e.subtype === "endOfTrack"

export const isSetTempoEvent = (
  e: TrackEvent,
): e is TrackEventOf<SetTempoEvent> =>
  "subtype" in e && e.subtype === "setTempo"

export const isTimeSignatureEvent = (
  e: TrackEvent,
): e is TrackEventOf<TimeSignatureEvent> =>
  "subtype" in e && e.subtype === "timeSignature"

export const isControllerEvent = (
  e: TrackEvent,
): e is TrackEventOf<ControllerEvent> =>
  "subtype" in e && e.subtype === "controller"

export const isControllerEventWithType =
  (controllerType: number) =>
  (e: TrackEvent): e is TrackEventOf<ControllerEvent> =>
    isControllerEvent(e) && e.controllerType === controllerType

export const isVolumeEvent = isControllerEventWithType(7)
export const isPanEvent = isControllerEventWithType(10)
export const isModulationEvent = isControllerEventWithType(1)
export const isExpressionEvent = isControllerEventWithType(0x0b)

export const isSequencerSpecificEvent = (
  e: TrackEvent,
): e is TrackEventOf<SequencerSpecificEvent> =>
  "subtype" in e && e.subtype === "sequencerSpecific"
