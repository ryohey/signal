import { Range } from "../entities/geometry/Range"

export const interpolate = (
  valueRange: Range,
  tickRange: Range,
  easing: (t: number) => number = (t) => t,
) => {
  const [startValue, endValue] = valueRange
  const [startTick, endTick] = tickRange

  return endTick === startTick
    ? () => endValue
    : (tick: number) => {
        const t = (tick - startTick) / (endTick - startTick)
        const value = startValue + easing(t) * (endValue - startValue)
        return Math.floor(Range.clamp(valueRange, value))
      }
}
