import { AnyEvent } from "midifile-ts"
import { addTick, toTrackEvents } from "./toTrackEvents"

describe("toTrackEvents", () => {
  it("addTick", () => {
    const events = [
      {
        deltaTime: 0,
      },
      {
        deltaTime: 0,
      },
      {
        deltaTime: 10,
      },
      {
        deltaTime: 11,
      },
      {
        deltaTime: 11,
      },
    ]
    const result = addTick(events)
    expect(result.length).toBe(events.length)
    expect(result[0]).toStrictEqual({
      tick: 0,
    })
    expect(result[1]).toStrictEqual({
      tick: 0,
    })
    expect(result[2]).toStrictEqual({
      tick: 10,
    })
    expect(result[3]).toStrictEqual({
      tick: 21,
    })
    expect(result[4]).toStrictEqual({
      tick: 32,
    })
  })
  it("convert to track events", () => {
    const events: AnyEvent[] = [
      {
        deltaTime: 0,
        type: "meta",
        subtype: "endOfTrack",
      },
      {
        deltaTime: 93,
        type: "channel",
        subtype: "noteOn",
        noteNumber: 14,
        velocity: 120,
        channel: 5,
      },
      {
        deltaTime: 100,
        type: "channel",
        subtype: "noteOff",
        noteNumber: 14,
        velocity: 0,
        channel: 5,
      },
    ]
    const result = toTrackEvents(events)
    expect(result.length).toBe(1)
    expect(result[0]).toStrictEqual({
      id: -1,
      type: "channel",
      subtype: "note",
      noteNumber: 14,
      tick: 93,
      duration: 100,
      velocity: 120,
    })
  })
})
