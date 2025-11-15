export function intersection<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  const result = new Set<T>()
  for (const item of a) {
    if (b.has(item)) {
      result.add(item)
    }
  }
  return result
}

export const deletedSet =
  <T>(value: T) =>
  (set: ReadonlySet<T>): Set<T> => {
    const result = new Set(set)
    result.delete(value)
    return result
  }

export const addedSet =
  <T>(value: T) =>
  (set: ReadonlySet<T>): Set<T> => {
    const result = new Set(set)
    result.add(value)
    return result
  }

export const toggleSet =
  <T>(value: T) =>
  (set: ReadonlySet<T>): Set<T> => {
    const result = new Set(set)
    if (result.has(value)) {
      result.delete(value)
    } else {
      result.add(value)
    }
    return result
  }
