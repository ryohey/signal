import { isEventInRange, isEventOverlapRange, Range } from "@signal-app/core"
import { describe, expect, it } from "vitest"

describe("filterEvents", () => {
  const events = [
    { tick: 0 },
    { tick: 5, duration: 5 },
    { tick: 5, duration: 6 },
    { tick: 5, duration: 100 },
    { tick: 10 },
    { tick: 20 },
    { tick: 50 },
  ]

  describe("isEventInRange", () => {
    it("should contain the event placed at the start tick but the end tick", () => {
      expect(events.filter(isEventInRange(Range.create(10, 50)))).toStrictEqual(
        [{ tick: 10 }, { tick: 20 }],
      )
    })
  })

  describe("isEventOverlapRange", () => {
    it("should contain events with duration", () => {
      expect(
        events.filter(isEventOverlapRange(Range.create(10, 50))),
      ).toStrictEqual([
        { tick: 5, duration: 6 },
        { tick: 5, duration: 100 },
        { tick: 10 },
        { tick: 20 },
      ])
    })
  })
})
