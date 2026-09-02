import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { isTimeSignatureEvent } from "../../event/identify"
import { TrackEvent } from "../../event/TrackEvent"
import { addTimeSignature } from "./timeSignature"

describe("track mutations/timeSignature", () => {
  it("addTimeSignature creates a time signature event at tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const created = addTimeSignature(48, 3, 4)(events)

    expect(created.tick).toBe(48)
    expect(isTimeSignatureEvent(created)).toBe(true)
  })
})
