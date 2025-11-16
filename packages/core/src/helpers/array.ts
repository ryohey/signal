export function isNotNull<T>(a: T | null): a is T {
  return a !== null
}

export function isNotUndefined<T>(a: T | undefined): a is T {
  return a !== undefined
}

export function isNotNullOrUndefined<T>(a: T | null): a is T {
  return a !== null && a !== undefined
}
