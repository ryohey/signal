import { isDevelopment } from "../../helpers/isDevelopment"
import type { Branded } from "../../types"

export type Range = Branded<readonly [number, number], "Range">

export namespace Range {
  export function fromUnordered(a: number, b: number): Range {
    return [Math.min(a, b), Math.max(a, b)] as unknown as Range
  }

  export function fromLength(start: number, length: number): Range {
    return [start, start + length] as unknown as Range
  }

  export function create(start: number, end: number): Range {
    if (isDevelopment() && start > end) {
      throw new Error(
        `Range.create requires start <= end, but got start=${start}, end=${end}`,
      )
    }
    return [start, end] as unknown as Range
  }

  export function point(value: number): Range {
    return [value, value] as unknown as Range
  }

  export function contains(range: Range, value: number): boolean {
    const [start, end] = range
    return start <= value && value < end
  }

  export function intersects(a: Range, b: Range): boolean {
    const [startA, endA] = a
    const [startB, endB] = b
    return startA < endB && startB < endA
  }

  export function clamp(range: Range, value: number): number {
    const [start, end] = range
    return Math.min(Math.max(start, value), end)
  }
}
