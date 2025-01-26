import { clamp, flow } from "lodash"
import { bpmToUSecPerBeat, uSecPerBeatToBPM } from "../../helpers/bpm"
import { controllerTypeString } from "../../helpers/noteNumberString"
import { TrackEvent } from "../../track"

export interface EventInputProp {
  type: "text" | "number"
  value: string
}

export type EventValueUpdator = {
  // null means no update
  update: (value: string) => any | null
}

// Abstraction Layer for manipulating TrackEvent on EventList
export type EventController = {
  name: string
  gate?: EventInputProp & EventValueUpdator
  value?: EventInputProp & EventValueUpdator
}

export function getEventController<T extends TrackEvent>(
  e: T,
): EventController {
  switch (e.type) {
    case "channel":
      switch (e.subtype) {
        case "controller":
          return {
            name:
              controllerTypeString(e.controllerType) ?? `CC${e.controllerType}`,
            value: {
              type: "number",
              value: e.value.toFixed(0),
              update: intConverter(0, 127, (value) => ({ value })),
            },
          }
        case "note":
          return {
            name: "Note",
            value: {
              type: "number",
              value: e.velocity.toFixed(0),
              update: intConverter(1, 127, (velocity) => ({ velocity })),
            },
            gate: {
              type: "number",
              value: e.duration.toFixed(0),
              update: intConverter(0, Infinity, (duration) => ({ duration })),
            },
          }
        case "programChange":
          return {
            name: "Program Change",
            value: {
              type: "number",
              value: e.value.toFixed(0),
              update: intConverter(0, 127, (value) => ({ value })),
            },
          }
        case "pitchBend":
          return {
            name: "Pitch Bend",
            value: {
              type: "number",
              value: e.value.toFixed(0),
              update: intConverter(0, 16384, (value) => ({ value })),
            },
          }
        default:
          return { name: e.subtype }
      }
    case "meta":
      switch (e.subtype) {
        case "trackName":
          return {
            name: "Track Name",
            value: {
              type: "text",
              value: e.text,
              update: (text) => ({ text }),
            },
          }
        case "midiChannelPrefix":
          return {
            name: "MIDI Channel Prefix",
            value: {
              type: "number",
              value: e.value.toFixed(0),
              update: intConverter(0, 127, (channel) => ({ channel })),
            },
          }
        case "setTempo":
          return {
            name: "Tempo",
            value: {
              type: "number",
              value: uSecPerBeatToBPM(e.microsecondsPerBeat).toFixed(3),
              update: flow(
                parseInt,
                createClamp(1, 512),
                bpmToUSecPerBeat,
                Math.floor,
                nanToNull,
                optional((microsecondsPerBeat) => ({ microsecondsPerBeat })),
              ),
            },
          }
        default:
          return { name: e.subtype }
      }
    case "dividedSysEx":
    case "sysEx":
      return { name: e.type }
  }
}

const nanToNull = (value: number) => {
  if (Number.isNaN(value)) {
    return null
  }
  return value
}

const createClamp = (min: number, max: number) => (value: number) =>
  clamp(value, min, max)

const optional =
  <T, S>(fn: (value: T) => S) =>
  (value: T | null) => {
    if (value === null) {
      return null
    }
    return fn(value)
  }

const intConverter = <T>(
  minValue: number,
  maxValue: number,
  fn: (value: number) => T,
) => flow(parseInt, createClamp(minValue, maxValue), nanToNull, optional(fn))
