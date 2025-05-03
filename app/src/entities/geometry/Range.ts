export type Range = readonly [number, number]

export namespace Range {
  export function fromLength(start: number, length: number): Range {
    return [start, start + length]
  }

  export function create(start: number, end: number): Range {
    return [start, end]
  }

  export function point(value: number): Range {
    return [value, value]
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
