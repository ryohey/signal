import { describe, expect, it } from "vitest";
import { sortForOutput } from "./outputOrder";
import type { TrackEvent } from "./TrackEvent";

describe("sortForOutput", () => {
  it("moves a bank select after a program change to just before it", () => {
    const events = [
      {
        id: 0,
        tick: 0,
        type: "channel",
        subtype: "note",
        noteNumber: 60,
        velocity: 100,
        duration: 10,
      },
      { id: 1, tick: 0, type: "channel", subtype: "programChange", value: 1 },
      {
        id: 2,
        tick: 0,
        type: "channel",
        subtype: "controller",
        controllerType: 0,
        value: 8,
      },
      {
        id: 3,
        tick: 10,
        type: "channel",
        subtype: "controller",
        controllerType: 7,
        value: 100,
      },
    ] as TrackEvent[]

    expect(sortForOutput(events).map((e) => e.id)).toEqual([0, 2, 1, 3])
  })

  it("does not move a bank select past a reset before the program change", () => {
    const events = [
      { id: 0, tick: 0, type: "sysEx", data: [0x41] },
      {
        id: 1,
        tick: 0,
        type: "channel",
        subtype: "controller",
        controllerType: 0,
        value: 8,
      },
      { id: 2, tick: 0, type: "channel", subtype: "programChange", value: 1 },
    ] as unknown as TrackEvent[]

    expect(sortForOutput(events).map((e) => e.id)).toEqual([0, 1, 2])
  })

  it("does not move a bank select past a reset after the program change", () => {
    const events = [
      { id: 0, tick: 0, type: "channel", subtype: "programChange", value: 1 },
      { id: 1, tick: 0, type: "sysEx", data: [0x41] },
      {
        id: 2,
        tick: 0,
        type: "channel",
        subtype: "controller",
        controllerType: 0,
        value: 8,
      },
    ] as unknown as TrackEvent[]

    expect(sortForOutput(events).map((e) => e.id)).toEqual([0, 1, 2])
  })
})
