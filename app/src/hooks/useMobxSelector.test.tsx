import { act, renderHook } from "@testing-library/react"
import { computed, makeObservable, observable, runInAction } from "mobx"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useMobxSelector } from "./useMobxSelector"

class Store {
  items: number[] = [1, 2, 3]

  constructor() {
    makeObservable(this, {
      items: observable,
      evenItems: computed,
    })
  }

  // Returns a new array whenever it is recomputed
  get evenItems() {
    return this.items.filter((n) => n % 2 === 0)
  }
}

describe("useMobxSelector", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns a cached snapshot for a computed value that is not observed yet", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const store = new Store()

    const { result } = renderHook(() =>
      useMobxSelector(() => store.evenItems, [store]),
    )

    expect(result.current).toEqual([2])
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("updates when the selected value changes", () => {
    const store = new Store()

    const { result } = renderHook(() =>
      useMobxSelector(() => store.evenItems, [store]),
    )

    act(() => {
      runInAction(() => {
        store.items = [2, 4, 5]
      })
    })

    expect(result.current).toEqual([2, 4])
  })

  it("selects from the new store when deps change", () => {
    const store1 = new Store()
    const store2 = new Store()
    runInAction(() => {
      store2.items = [6]
    })

    const { result, rerender } = renderHook(
      ({ store }) => useMobxSelector(() => store.evenItems, [store]),
      { initialProps: { store: store1 } },
    )
    expect(result.current).toEqual([2])

    rerender({ store: store2 })
    expect(result.current).toEqual([6])
  })
})
