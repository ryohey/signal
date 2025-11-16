import {
  ControllerEvent,
  EndOfTrackEvent,
  Event,
  NoteOffEvent,
  NoteOnEvent,
  PitchBendEvent,
  PortPrefixEvent,
  ProgramChangeEvent,
  SequencerSpecificEvent,
  SetTempoEvent,
  TimeSignatureEvent,
  TrackNameEvent,
} from "midifile-ts"

/* factory */

export function midiEvent<T extends string>(
  deltaTime: number,
  type: T,
): Event<T> {
  return {
    deltaTime,
    type,
  }
}

export function endOfTrackMidiEvent(deltaTime: number): EndOfTrackEvent {
  return {
    deltaTime,
    type: "meta",
    subtype: "endOfTrack",
  }
}

export function portPrefixMidiEvent(
  deltaTime: number,
  port: number,
): PortPrefixEvent {
  return {
    deltaTime,
    type: "meta",
    subtype: "portPrefix",
    port,
  }
}

export function trackNameMidiEvent(
  deltaTime: number,
  text: string,
): TrackNameEvent {
  return {
    deltaTime,
    type: "meta",
    subtype: "trackName",
    text,
  }
}

// from bpm: SetTempoMidiEvent(t, 60000000 / bpm)
export function setTempoMidiEvent(
  deltaTime: number,
  microsecondsPerBeat: number,
): SetTempoEvent {
  return {
    deltaTime,
    type: "meta",
    subtype: "setTempo",
    microsecondsPerBeat,
  }
}

export function timeSignatureMidiEvent(
  deltaTime: number,
  numerator = 4,
  denominator = 4,
  metronome = 24,
  thirtyseconds = 8,
): TimeSignatureEvent {
  return {
    deltaTime,
    type: "meta",
    subtype: "timeSignature",
    numerator,
    denominator,
    metronome,
    thirtyseconds,
  }
}

// channel events

export function noteOnMidiEvent(
  deltaTime: number,
  channel: number,
  noteNumber: number,
  velocity: number,
): NoteOnEvent {
  return {
    deltaTime,
    type: "channel",
    subtype: "noteOn",
    channel,
    noteNumber,
    velocity,
  }
}

export function noteOffMidiEvent(
  deltaTime: number,
  channel: number,
  noteNumber: number,
  velocity: number = 0,
): NoteOffEvent {
  return {
    deltaTime,
    type: "channel",
    subtype: "noteOff",
    channel,
    noteNumber,
    velocity,
  }
}

export function pitchBendMidiEvent(
  deltaTime: number,
  channel: number,
  value: number,
): PitchBendEvent {
  return {
    deltaTime,
    type: "channel",
    subtype: "pitchBend",
    channel,
    value,
  }
}

export function programChangeMidiEvent(
  deltaTime: number,
  channel: number,
  value: number,
): ProgramChangeEvent {
  return {
    deltaTime,
    type: "channel",
    subtype: "programChange",
    channel,
    value,
  }
}

// controller events

export function controllerMidiEvent(
  deltaTime: number,
  channel: number,
  controllerType: number,
  value: number,
): ControllerEvent {
  return {
    deltaTime,
    type: "channel",
    subtype: "controller",
    channel,
    controllerType,
    value,
  }
}

export function modulationMidiEvent(
  deltaTime: number,
  channel: number,
  value: number,
) {
  return controllerMidiEvent(deltaTime, channel, 0x01, value)
}

export function volumeMidiEvent(
  deltaTime: number,
  channel: number,
  value: number,
) {
  return controllerMidiEvent(deltaTime, channel, 0x07, value)
}

export function panMidiEvent(
  deltaTime: number,
  channel: number,
  value: number,
) {
  return controllerMidiEvent(deltaTime, channel, 0x0a, value)
}

export function expressionMidiEvent(
  deltaTime: number,
  channel: number,
  value: number,
) {
  return controllerMidiEvent(deltaTime, channel, 0x0b, value)
}

export function resetAllMidiEvent(deltaTime: number, channel: number) {
  return controllerMidiEvent(deltaTime, channel, 121, 0)
}

export function sequencerSpecificEvent(
  deltaTime: number,
  data: number[],
): SequencerSpecificEvent {
  return {
    type: "meta",
    subtype: "sequencerSpecific",
    deltaTime,
    data,
  }
}

// Control Change

export function controlChangeEvents(
  deltaTime: number,
  channel: number,
  rpnMsb: number,
  rpnLsb: number,
  dataMsb?: number | undefined,
  dataLsb?: number | undefined,
): ControllerEvent[] {
  const rpn = [
    controllerMidiEvent(deltaTime, channel, 101, rpnMsb),
    controllerMidiEvent(0, channel, 100, rpnLsb),
  ]

  const data: ControllerEvent[] = []
  if (dataMsb !== undefined) {
    data.push(controllerMidiEvent(0, channel, 6, dataMsb))
  }
  if (dataLsb !== undefined) {
    data.push(controllerMidiEvent(0, channel, 38, dataLsb))
  }

  return [...rpn, ...data]
}

// value: 0 - 24 (半音 / Half sound)
export function pitchbendSensitivityEvents(
  deltaTime: number,
  channel: number,
  value = 2,
) {
  return controlChangeEvents(deltaTime, channel, 0, 0, value)
}

// value: -8192 - 8191
export function masterFineTuningEvents(
  deltaTime: number,
  channel: number,
  value = 0,
) {
  const s = value + 0x2000
  const m = Math.floor(s / 0x80)
  const l = s - m * 0x80
  return controlChangeEvents(deltaTime, channel, 0, 1, m, l)
}

// value: -24 - 24
export function masterCoarceTuningEvents(
  deltaTime: number,
  channel: number,
  value = 0,
) {
  return controlChangeEvents(deltaTime, channel, 0, 2, value + 64)
}
