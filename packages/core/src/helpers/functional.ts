export const flatMap =
  <A, B>(f: (a: A) => B | null) =>
  (a: A | null): B | null =>
    a === null ? null : f(a)
