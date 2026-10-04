import { Range } from "../entities"

export const isEventInRange =
  <T extends { tick: number }>(range: Range) =>
  (e: T) =>
    Range.contains(range, e.tick)

export const isEventOverlapRange =
  <T extends { tick: number; duration?: number }>(range: Range) =>
  (e: T): boolean => {
    if ("duration" in e && typeof e.duration === "number") {
      return Range.intersects(range, Range.fromLength(e.tick, e.duration))
    }
    return Range.contains(range, e.tick)
  }
