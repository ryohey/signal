import { atom, createStore } from "jotai"
import { describe, expect, it } from "vitest"
import {
  historyAtom,
  restoreHistoryAtoms,
  snapshotHistoryAtoms,
} from "./historyAtom"

describe("historyAtom", () => {
  it("snapshots and restores registered atoms", () => {
    const registered = historyAtom(atom(1))
    const store = createStore()

    const snapshot = snapshotHistoryAtoms(store.get)
    store.set(registered, 2)
    expect(store.get(registered)).toBe(2)

    restoreHistoryAtoms(store.set, snapshot)
    expect(store.get(registered)).toBe(1)
  })

  it("leaves unregistered atoms alone", () => {
    historyAtom(atom(0))
    const unregistered = atom("untouched")
    const store = createStore()

    const snapshot = snapshotHistoryAtoms(store.get)
    store.set(unregistered, "changed")
    restoreHistoryAtoms(store.set, snapshot)

    expect(store.get(unregistered)).toBe("changed")
  })

  it("deep-clones values so later mutation cannot corrupt a snapshot", () => {
    const registered = historyAtom(atom<{ ids: number[] }>({ ids: [1] }))
    const store = createStore()

    const snapshot = snapshotHistoryAtoms(store.get)
    // mutate the live value in place, as a careless caller might
    store.get(registered).ids.push(2)

    restoreHistoryAtoms(store.set, snapshot)
    expect(store.get(registered).ids).toStrictEqual([1])
  })

  it("works with derived writable atoms, not just primitive ones", () => {
    const source = atom({ nested: "a" })
    const derived = historyAtom(
      atom(
        (get) => get(source).nested,
        (_get, set, next: string) => set(source, { nested: next }),
      ),
    )
    const store = createStore()

    const snapshot = snapshotHistoryAtoms(store.get)
    store.set(derived, "b")
    expect(store.get(derived)).toBe("b")

    restoreHistoryAtoms(store.set, snapshot)
    expect(store.get(derived)).toBe("a")
  })
})
