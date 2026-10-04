import { isEventInRange, Range } from "@signal-app/core"

// update velocities of notes in the specified range using linear interpolation
export const updateVelocitiesLinear =
  <Note extends { tick: number; velocity: number }>(
    startTick: number,
    startValue: number,
    endTick: number,
    endValue: number,
  ) =>
  (notes: readonly Note[]): readonly Note[] => {
    const minTick = Math.min(startTick, endTick)
    const maxTick = Math.max(startTick, endTick)
    const minValue = Math.min(startValue, endValue)
    const maxValue = Math.max(startValue, endValue)
    const getValue = (tick: number) =>
      Math.floor(
        Math.min(
          maxValue,
          Math.max(
            minValue,
            ((tick - startTick) / (endTick - startTick)) *
              (endValue - startValue) +
              startValue,
          ),
        ),
      )

    const eventsToUpdate = notes.filter(
      isEventInRange(Range.create(minTick, maxTick)),
    )

    return eventsToUpdate.map((e) => ({
      ...e,
      velocity: getValue(e.tick),
    }))
  }
