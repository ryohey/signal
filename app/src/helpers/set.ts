export function intersection<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  const result = new Set<T>()
  for (const item of a) {
    if (b.has(item)) {
      result.add(item)
    }
  }
  return result
}

export function deletedSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const result = new Set(set)
  result.delete(value)
  return result
}

export function addedSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const result = new Set(set)
  result.add(value)
  return result
}
