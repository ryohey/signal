import { ControllerEvent } from "midifile-ts"

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
