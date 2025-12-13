// abstraction layer for pitch-bend and controller events

import {
  controllerMidiEvent,
  isControllerEventWithType,
  isPitchBendEvent,
  pitchBendMidiEvent,
} from "@signal-app/core"

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

  export const equals = (
    item: ValueEventType,
    other: ValueEventType
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
