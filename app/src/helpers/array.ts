export function isNotNull<T>(a: T | null): a is T {
  return a !== null
}

export function isNotUndefined<T>(a: T | undefined): a is T {
  return a !== undefined
}

export function isNotNullOrUndefined<T>(a: T | null): a is T {
  return a !== null && a !== undefined
}

export const joinObjects = <T extends object>(
  list: T[],
  separator: (prev: T, next: T) => T,
): T[] => {
  const result = []
  for (let i = 0; i < list.length; i++) {
    result.push(list[i])
    if (i < list.length - 1) {
      result.push(separator(list[i], list[i + 1]))
    }
  }
  return result
}

export const closedRange = (start: number, end: number, step: number) => {
  const result = []
  for (let i = start; i <= end; i += step) {
    result.push(i)
  }
  return result
}
