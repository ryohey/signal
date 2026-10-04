import { describe, expect, it } from "vitest"
import { ArrangeSelection } from "./ArrangeSelection"

const quantizer = {
  quantizeFloor: (tick: number) => Math.floor(tick / 10) * 10,
  quantizeCeil: (tick: number) => Math.ceil(tick / 10) * 10,
}

describe("entities/ArrangeSelection", () => {
  it("fromPoint quantizes tick and covers a single track row", () => {
    expect(
      ArrangeSelection.fromPoint({ tick: 15, trackIndex: 2.5 }, quantizer),
    ).toStrictEqual({
      fromTick: 10,
      toTick: 20,
      fromTrackIndex: 2,
      toTrackIndex: 3,
    })
  })

  it("fromPoints unions and clamps the two endpoints", () => {
    expect(
      ArrangeSelection.fromPoints(
        { tick: 15, trackIndex: 2 },
        { tick: 45, trackIndex: -1 },
        quantizer,
        3,
      ),
    ).toStrictEqual({
      fromTick: 10,
      toTick: 50,
      fromTrackIndex: 0,
      toTrackIndex: 3,
    })
  })

  it("union covers the min/max of both selections", () => {
    const a = { fromTick: 10, toTick: 20, fromTrackIndex: 1, toTrackIndex: 2 }
    const b = { fromTick: 5, toTick: 30, fromTrackIndex: 0, toTrackIndex: 4 }
    expect(ArrangeSelection.union(a, b)).toStrictEqual({
      fromTick: 5,
      toTick: 30,
      fromTrackIndex: 0,
      toTrackIndex: 4,
    })
  })

  it("clamp keeps ticks non-negative and track indices within [0, maxTrackIndex]", () => {
    const selection = {
      fromTick: -5,
      toTick: 10,
      fromTrackIndex: -1,
      toTrackIndex: 10,
    }
    expect(ArrangeSelection.clamp(selection, 3)).toStrictEqual({
      fromTick: 0,
      toTick: 10,
      fromTrackIndex: 0,
      toTrackIndex: 3,
    })
  })

  it("moved shifts the selection by the given delta", () => {
    const selection = {
      fromTick: 10,
      toTick: 20,
      fromTrackIndex: 1,
      toTrackIndex: 2,
    }
    expect(
      ArrangeSelection.moved(selection, { tick: 5, trackIndex: 1 }),
    ).toStrictEqual({
      fromTick: 15,
      toTick: 25,
      fromTrackIndex: 2,
      toTrackIndex: 3,
    })
  })

  it("start and end return the selection's corner points", () => {
    const selection = {
      fromTick: 10,
      toTick: 20,
      fromTrackIndex: 1,
      toTrackIndex: 2,
    }
    expect(ArrangeSelection.start(selection)).toStrictEqual({
      tick: 10,
      trackIndex: 1,
    })
    expect(ArrangeSelection.end(selection)).toStrictEqual({
      tick: 20,
      trackIndex: 2,
    })
  })
})
