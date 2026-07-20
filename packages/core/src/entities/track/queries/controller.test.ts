import { ControllerEvent } from "midifile-ts"
import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { isControllerEventWithType } from "../../event/identify"
import { TrackEvent, TrackEventOf } from "../../event/TrackEvent"
import { Range } from "../../geometry/Range"
import { addEvent } from "../mutations"
import { getControlEventsInRangeWithPrevious } from "./controller"

describe("track queries/controller", () => {
  it("returns previous matching event and events in range", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const panAt10 = addEvent<TrackEventOf<ControllerEvent>>({
      type: "channel",
      subtype: "controller",
      tick: 10,
      controllerType: 10,
      value: 64,
    })(events)
    const panAt30 = addEvent<TrackEventOf<ControllerEvent>>({
      type: "channel",
      subtype: "controller",
      tick: 30,
      controllerType: 10,
      value: 70,
    })(events)
    addEvent<TrackEventOf<ControllerEvent>>({
      type: "channel",
      subtype: "controller",
      tick: 35,
      controllerType: 7,
      value: 100,
    })(events)
    const panAt40 = addEvent<TrackEventOf<ControllerEvent>>({
      type: "channel",
      subtype: "controller",
      tick: 40,
      controllerType: 10,
      value: 80,
    })(events)

    const result = getControlEventsInRangeWithPrevious(
      isControllerEventWithType(10),
      Range.create(32, 50),
    )(events.getArray())

    expect(result.map((event) => event.id)).toStrictEqual([
      panAt30.id,
      panAt40.id,
    ])
    expect(result.map((event) => event.value)).toStrictEqual([70, 80])
    expect(result.some((event) => event.id === panAt10.id)).toBe(false)
  })

  it("returns only in-range events when no previous event exists", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const panAt40 = addEvent<TrackEventOf<ControllerEvent>>({
      type: "channel",
      subtype: "controller",
      tick: 40,
      controllerType: 10,
      value: 80,
    })(events)

    const result = getControlEventsInRangeWithPrevious(
      isControllerEventWithType(10),
      Range.create(32, 50),
    )(events.getArray())

    expect(result.map((event) => event.id)).toStrictEqual([panAt40.id])
  })
})
