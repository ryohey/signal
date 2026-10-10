import { Range } from "../entities/geometry/Range"

export type InterpolationPoint = { tick: number; value: number }

/**
 * Returns a function that maps a tick to the value on the curve from `from`
 * to `to`. `from.tick` may be greater than `to.tick` (e.g. a right-to-left
 * drag); `easing` is always applied in the direction from `from` to `to`.
 */
export const interpolate = (
  from: InterpolationPoint,
  to: InterpolationPoint,
  easing: (t: number) => number = (t) => t,
) => {
  const valueRange = Range.fromUnordered(from.value, to.value)

  return to.tick === from.tick
    ? () => to.value
    : (tick: number) => {
        const t = (tick - from.tick) / (to.tick - from.tick)
        const value = from.value + easing(t) * (to.value - from.value)
        return Math.floor(Range.clamp(valueRange, value))
      }
}
