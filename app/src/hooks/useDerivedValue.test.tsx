import { Emitter } from "@signal-app/observable"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useDerivedValue } from "./useDerivedValue"

describe("useDerivedValue", () => {
  it("returns the initial derived snapshot", () => {
    const source = new Emitter<void>()
    const base = 1

    const { result } = renderHook(() =>
      useDerivedValue(source.subscribe, () => base * 2),
    )

    expect(result.current).toBe(2)
  })

  it("updates when source notifies and derived value changes", () => {
    const source = new Emitter<void>()
    let base = 1

    const { result } = renderHook(() =>
      useDerivedValue(source.subscribe, () => base * 2),
    )

    act(() => {
      base = 3
      source.emit()
    })

    expect(result.current).toBe(6)
  })

  it("does not re-render when derived value is unchanged", () => {
    const source = new Emitter<void>()
    const base = 10
    let renderCount = 0

    const { result } = renderHook(() => {
      renderCount += 1
      return useDerivedValue(source.subscribe, () => base)
    })

    expect(result.current).toBe(10)
    expect(renderCount).toBe(1)

    act(() => {
      source.emit()
    })

    expect(result.current).toBe(10)
    expect(renderCount).toBe(1)
  })

  it("unsubscribes from source on unmount", () => {
    const source = new Emitter<void>()
    const subscribeSource = vi.fn(source.subscribe)
    let activeSubscriptions = 0

    const subscribeWithCount = (listener: () => void) => {
      const unsubscribe = subscribeSource(listener)
      activeSubscriptions += 1
      return () => {
        activeSubscriptions -= 1
        unsubscribe()
      }
    }

    const { unmount } = renderHook(() =>
      useDerivedValue(subscribeWithCount, () => 1),
    )

    expect(subscribeSource).toHaveBeenCalledTimes(1)
    expect(activeSubscriptions).toBe(1)

    unmount()

    expect(activeSubscriptions).toBe(0)
  })

  it("keeps subscription stable when deriveValue reference is stable", () => {
    const source = new Emitter<void>()
    let base = 1
    const subscribeSource = vi.fn(source.subscribe)
    const deriveValue = vi.fn(() => base)

    const { result, rerender } = renderHook(
      ({ multiplier }: { multiplier: number }) =>
        useDerivedValue(subscribeSource, deriveValue) * multiplier,
      {
        initialProps: { multiplier: 1 },
      },
    )

    expect(result.current).toBe(1)
    expect(subscribeSource).toHaveBeenCalledTimes(1)
    expect(deriveValue).toHaveBeenCalledTimes(1)

    rerender({ multiplier: 2 })

    expect(result.current).toBe(2)
    expect(subscribeSource).toHaveBeenCalledTimes(1)
    expect(deriveValue).toHaveBeenCalledTimes(1)

    act(() => {
      base = 5
      source.emit()
    })

    expect(result.current).toBe(10)
    expect(deriveValue).toHaveBeenCalledTimes(2)
  })

  it("returns the same object reference until source notifies", () => {
    const source = new Emitter<void>()
    let version = 1
    const deriveValue = vi.fn(() => ({ version }))

    const { result, rerender } = renderHook(
      ({ multiplier }: { multiplier: number }) => {
        const value = useDerivedValue(source.subscribe, deriveValue)
        return {
          value,
          multipliedVersion: value.version * multiplier,
        }
      },
      {
        initialProps: { multiplier: 1 },
      },
    )

    const firstRef = result.current.value
    expect(firstRef.version).toBe(1)
    expect(deriveValue).toHaveBeenCalledTimes(1)

    rerender({ multiplier: 2 })

    expect(result.current.value).toBe(firstRef)
    expect(result.current.multipliedVersion).toBe(2)
    expect(deriveValue).toHaveBeenCalledTimes(1)

    act(() => {
      version = 2
      source.emit()
    })

    expect(result.current.value).not.toBe(firstRef)
    expect(result.current.value.version).toBe(2)
    expect(deriveValue).toHaveBeenCalledTimes(2)
  })

  it("switches source subscription when subscribeSource changes", () => {
    const sourceA = new Emitter<void>()
    const sourceB = new Emitter<void>()
    const subscribeA = vi.fn(sourceA.subscribe)
    const subscribeB = vi.fn(sourceB.subscribe)
    let valueA = 1
    let valueB = 10

    const { result, rerender } = renderHook(
      ({ useB }: { useB: boolean }) =>
        useDerivedValue(useB ? subscribeB : subscribeA, () =>
          useB ? valueB : valueA,
        ),
      {
        initialProps: { useB: false },
      },
    )

    expect(result.current).toBe(1)
    expect(subscribeA).toHaveBeenCalledTimes(1)
    expect(subscribeB).toHaveBeenCalledTimes(0)

    rerender({ useB: true })

    expect(result.current).toBe(10)
    expect(subscribeA).toHaveBeenCalledTimes(1)
    expect(subscribeB).toHaveBeenCalledTimes(1)

    act(() => {
      valueA = 2
      sourceA.emit()
    })
    expect(result.current).toBe(10)

    act(() => {
      valueB = 20
      sourceB.emit()
    })
    expect(result.current).toBe(20)
  })
})
