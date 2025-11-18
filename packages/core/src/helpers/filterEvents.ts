import { Range } from "../entities"

export const isEventInRange =
  <T extends { tick: number }>(range: Range) =>
  (e: T) =>
    Range.contains(range, e.tick)

export const isEventOverlapRange =
  <T extends { tick: number; duration?: number }>(range: Range) =>
  (e: T): boolean => {
    if ("duration" in e && typeof e.duration === "number") {
      const eventTickEnd = e.tick + e.duration
      const noteRange = Range.create(e.tick, eventTickEnd)
      return Range.intersects(range, noteRange)
    }
    return Range.contains(range, e.tick)
  }
