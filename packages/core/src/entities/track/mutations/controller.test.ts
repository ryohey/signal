import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { getPan, getVolume } from "../../event/selectors"
import { TrackEvent } from "../../event/TrackEvent"
import { setPan, setVolume } from "./controller"

describe("track mutations/controller", () => {
  it("setPan should update pan at the target tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    setPan(64, 1)(events)
    expect(getPan(1)(events.getArray())?.value).toBe(64)

    setPan(100, 1)(events)
    expect(getPan(1)(events.getArray())?.value).toBe(100)
  })

  it("setVolume should update volume at the target tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    setVolume(100, 1)(events)
    expect(getVolume(1)(events.getArray())?.value).toBe(100)

    setVolume(50, 1)(events)
    expect(getVolume(1)(events.getArray())?.value).toBe(50)
  })
})
