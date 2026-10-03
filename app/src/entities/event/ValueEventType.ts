// abstraction layer for pitch-bend and controller events

import {
  controllerMidiEvent,
  isControllerEventWithType,
  isPitchBendEvent,
  pitchBendMidiEvent,
} from "@signal-app/core"
import { clamp } from "lodash"
import { MIDIControlEvents } from "midifile-ts"

export type ValueEventType =
  | { type: "pitchBend" }
  | { type: "controller"; controllerType: number }

export namespace ValueEventType {
  export const getEventFactory = (t: ValueEventType) => (value: number) => {
    switch (t.type) {
      case "pitchBend":
        return pitchBendMidiEvent(0, 0, Math.round(value))
      case "controller":
        return controllerMidiEvent(0, 0, t.controllerType, Math.round(value))
    }
  }

  export const getEventPredicate = (t: ValueEventType) => {
    switch (t.type) {
      case "pitchBend":
        return isPitchBendEvent
      case "controller":
        return isControllerEventWithType(t.controllerType)
    }
  }

  // range of the raw MIDI value
  export const getValueRange = (t: ValueEventType) => {
    switch (t.type) {
      case "pitchBend":
        return { min: 0, max: 0x4000 - 1 }
      case "controller":
        return { min: 0, max: 0x80 - 1 }
    }
  }

  // offset subtracted from the raw value to get the value shown to the user
  // (e.g. pitch bend 0x2000 and pan 0x40 are displayed as 0)
  const getDisplayOffset = (t: ValueEventType) => {
    switch (t.type) {
      case "pitchBend":
        return 0x2000
      case "controller":
        return t.controllerType === MIDIControlEvents.MSB_PAN ? 0x40 : 0
    }
  }

  export const toDisplayValue = (t: ValueEventType, value: number) =>
    value - getDisplayOffset(t)

  // converts a displayed value to a raw MIDI value, clamped to the valid range
  export const fromDisplayValue = (t: ValueEventType, value: number) => {
    const { min, max } = getValueRange(t)
    return clamp(Math.round(value + getDisplayOffset(t)), min, max)
  }

  export const getDisplayValueRange = (t: ValueEventType) => {
    const { min, max } = getValueRange(t)
    return { min: toDisplayValue(t, min), max: toDisplayValue(t, max) }
  }

  export const equals = (
    item: ValueEventType,
    other: ValueEventType,
  ): boolean => {
    switch (item.type) {
      case "pitchBend":
        return other.type === "pitchBend"
      case "controller":
        return (
          other.type === "controller" &&
          item.controllerType === other.controllerType
        )
    }
  }
}
