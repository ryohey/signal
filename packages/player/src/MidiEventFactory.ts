import { ControllerEvent, SysExEvent } from "midifile-ts"

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

export function gsResetMidiEvent(
    deltaTime: number,
    data: number[],
): SysExEvent {
  return {
    deltaTime,
    type: "sysEx",
    data
  }
}
