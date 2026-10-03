import { renderHook } from "@testing-library/react"
import { observable, runInAction } from "mobx"
import { useSyncExternalStore } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { EventView } from "./EventView"

const createEventView = () => {
  const events = observable([{ tick: 0 }, { tick: 50 }, { tick: 200 }])
  const eventView = new EventView(() => events.slice())
  eventView.setRange(0, 100)
  return { events, eventView }
}

describe("EventView", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns the same snapshot before anything subscribes", () => {
    const { eventView } = createEventView()

    expect(eventView.getEvents()).toBe(eventView.getEvents())
    expect(eventView.getEvents()).toEqual([{ tick: 0 }, { tick: 50 }])
  })

  it("can be used with useSyncExternalStore", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const { eventView } = createEventView()

    const { result } = renderHook(() =>
      useSyncExternalStore(eventView.subscribe, eventView.getEvents),
    )

    expect(result.current).toEqual([{ tick: 0 }, { tick: 50 }])
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("returns events in the new range after setRange", () => {
    const { eventView } = createEventView()
    eventView.getEvents()

    eventView.setRange(100, 300)

    expect(eventView.getEvents()).toEqual([{ tick: 200 }])
  })

  it("notifies subscribers and returns updated events", () => {
    const { events, eventView } = createEventView()
    eventView.getEvents()
    const listener = vi.fn()
    const unsubscribe = eventView.subscribe(listener)

    runInAction(() => {
      events.push({ tick: 80 })
    })

    expect(listener).toHaveBeenCalled()
    expect(eventView.getEvents()).toEqual([
      { tick: 0 },
      { tick: 50 },
      { tick: 80 },
    ])
    unsubscribe()
  })
})
