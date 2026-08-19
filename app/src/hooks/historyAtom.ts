import { Getter, Setter, WritableAtom } from "jotai"
import { cloneDeep } from "lodash"

// An atom whose value takes part in undo/redo. Wrapping an atom is the only
// registration step: nothing central holds a roster of features, so adding a
// feature to history never means editing a shared file.
type AnyHistoryAtom = WritableAtom<unknown, [never], unknown>

const historyAtoms = new Set<AnyHistoryAtom>()

export type HistoryAtomsSnapshot = ReadonlyMap<AnyHistoryAtom, unknown>

/**
 * Marks an atom as part of undo/redo history.
 *
 * Takes an already-created atom rather than an initial value so that any
 * writable atom qualifies, including derived ones such as `focusAtom`.
 */
export function historyAtom<T, Args extends unknown[], R>(
  a: WritableAtom<T, Args, R>,
): WritableAtom<T, Args, R> {
  historyAtoms.add(a as unknown as AnyHistoryAtom)
  return a
}

export const snapshotHistoryAtoms = (get: Getter): HistoryAtomsSnapshot =>
  new Map([...historyAtoms].map((a) => [a, cloneDeep(get(a))]))

export const restoreHistoryAtoms = (
  set: Setter,
  snapshot: HistoryAtomsSnapshot,
): void => {
  snapshot.forEach((value, a) => {
    set(a, value as never)
  })
}
