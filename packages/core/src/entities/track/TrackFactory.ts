import {
  endOfTrackMidiEvent,
  expressionMidiEvent,
  masterCoarceTuningEvents,
  masterFineTuningEvents,
  modulationMidiEvent,
  panMidiEvent,
  pitchBendMidiEvent,
  pitchbendSensitivityEvents,
  programChangeMidiEvent,
  resetAllMidiEvent,
  setTempoMidiEvent,
  timeSignatureMidiEvent,
  trackNameMidiEvent,
  volumeMidiEvent,
} from "../../midi/MidiEvent"
import { toTrackEvents } from "../../midi/toTrackEvents"
import { Track } from "./Track"

export function conductorTrack(name = "") {
  const track = new Track()
  const events = toTrackEvents([
    trackNameMidiEvent(0, name),
    timeSignatureMidiEvent(0),
    setTempoMidiEvent(0, 60000000 / 120),
    endOfTrackMidiEvent(0),
  ])
  track.addEvents(events)
  return track
}

export const resetTrackMIDIEvents = (channel: number) => [
  resetAllMidiEvent(0, channel),
  trackNameMidiEvent(0, ""),
  panMidiEvent(0, channel, 64),
  volumeMidiEvent(0, channel, 100),
  expressionMidiEvent(0, channel, 127),
  ...masterCoarceTuningEvents(0, channel),
  ...masterFineTuningEvents(0, channel),
  ...pitchbendSensitivityEvents(0, channel, 12),
  pitchBendMidiEvent(0, channel, 0x2000),
  modulationMidiEvent(0, channel, 0),
  programChangeMidiEvent(0, channel, 0),
]

export function emptyTrack(channel: number) {
  if (!Number.isInteger(channel)) {
    throw new Error("channel is not integer")
  }
  const track = new Track()
  track.channel = channel
  const events = toTrackEvents([
    ...resetTrackMIDIEvents(channel),
    endOfTrackMidiEvent(1),
  ])
  track.addEvents(events)
  return track
}
