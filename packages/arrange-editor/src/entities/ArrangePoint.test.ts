import { describe, expect, it } from "vitest"
import { ArrangePoint } from "./ArrangePoint"

describe("entities/ArrangePoint", () => {
  it("sub returns the component-wise difference", () => {
    expect(
      ArrangePoint.sub({ tick: 10, trackIndex: 3 }, { tick: 4, trackIndex: 1 }),
    ).toStrictEqual({ tick: 6, trackIndex: 2 })
  })

  it("clamp keeps tick non-negative and trackIndex within [0, maxTrackIndex]", () => {
    expect(ArrangePoint.clamp({ tick: -5, trackIndex: -1 }, 3)).toStrictEqual({
      tick: 0,
      trackIndex: 0,
    })
    expect(ArrangePoint.clamp({ tick: 5, trackIndex: 10 }, 3)).toStrictEqual({
      tick: 5,
      trackIndex: 3,
    })
  })
})
