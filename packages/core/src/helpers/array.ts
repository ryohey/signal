export function isNotNull<T>(a: T | null): a is T {
  return a !== null
}

export function isNotUndefined<T>(a: T | undefined): a is T {
  return a !== undefined
}

export function isNotNullOrUndefined<T>(a: T | null | undefined): a is T {
  return a !== null && a !== undefined
}

export const closedRange = (start: number, end: number, step: number) => {
  const result = []
  for (let i = start; i <= end; i += step) {
    result.push(i)
  }
  return result
}

export const map =
  <T, U>(fn: (item: T) => U) =>
  (array: T[]): U[] =>
    array.map(fn)

export function filter<T, U extends T>(
  fn: (item: T) => item is U,
): (array: readonly T[]) => readonly U[]
export function filter<T>(
  fn: (item: T) => boolean,
): (array: readonly T[]) => readonly T[]
export function filter<T>(fn: (item: T) => boolean) {
  return (array: readonly T[]): readonly T[] => array.filter(fn)
}
