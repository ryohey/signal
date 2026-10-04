import { MIDIControlEvents } from "midifile-ts"
import { describe, expect, it } from "vitest"
import { ValueEventType } from "./ValueEventType"

const pitchBend: ValueEventType = { type: "pitchBend" }
const pan: ValueEventType = {
  type: "controller",
  controllerType: MIDIControlEvents.MSB_PAN,
}
const volume: ValueEventType = {
  type: "controller",
  controllerType: MIDIControlEvents.MSB_MAIN_VOLUME,
}

describe("ValueEventType", () => {
  it("converts raw values to display values", () => {
    expect(ValueEventType.toDisplayValue(pitchBend, 0x2000)).toBe(0)
    expect(ValueEventType.toDisplayValue(pitchBend, 0)).toBe(-8192)
    expect(ValueEventType.toDisplayValue(pan, 0x40)).toBe(0)
    expect(ValueEventType.toDisplayValue(volume, 100)).toBe(100)
  })

  it("converts display values to raw values", () => {
    expect(ValueEventType.fromDisplayValue(pitchBend, 0)).toBe(8192)
    expect(ValueEventType.fromDisplayValue(pitchBend, 8191)).toBe(16383)
    expect(ValueEventType.fromDisplayValue(pan, -64)).toBe(0)
    expect(ValueEventType.fromDisplayValue(volume, 100)).toBe(100)
  })

  it("clamps and rounds display values to the valid range", () => {
    expect(ValueEventType.fromDisplayValue(pitchBend, 9000)).toBe(16383)
    expect(ValueEventType.fromDisplayValue(pitchBend, -9000)).toBe(0)
    expect(ValueEventType.fromDisplayValue(pan, 100)).toBe(127)
    expect(ValueEventType.fromDisplayValue(volume, -1)).toBe(0)
    expect(ValueEventType.fromDisplayValue(volume, 64.6)).toBe(65)
  })

  it("returns the display value range", () => {
    expect(ValueEventType.getDisplayValueRange(pitchBend)).toEqual({
      min: -8192,
      max: 8191,
    })
    expect(ValueEventType.getDisplayValueRange(pan)).toEqual({
      min: -64,
      max: 63,
    })
    expect(ValueEventType.getDisplayValueRange(volume)).toEqual({
      min: 0,
      max: 127,
    })
  })
})
