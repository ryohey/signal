import { EventTickPositionView } from "./EventTickPositionView"

interface TestEvent {
  tick: number
  value: number
}

describe("EventTickPositionView", () => {
  const createEvents = (): TestEvent[] => [
    { tick: 0, value: 10 },
    { tick: 100, value: 20 },
    { tick: 200, value: 30 },
    { tick: 300, value: 40 },
  ]

  it("should return the last event at the exact tick position", () => {
    const events = createEvents()
    const view = new EventTickPositionView(() => events)
    view.setPosition(100)

    const event = view.getEvent()
    expect(event).toEqual({ tick: 100, value: 20 })
  })

  it("should return the last event before the tick position", () => {
    const events = createEvents()
    const view = new EventTickPositionView(() => events)
    view.setPosition(150)

    const event = view.getEvent()
    expect(event).toEqual({ tick: 100, value: 20 })
  })

  it("should return undefined when no events exist at or before the position", () => {
    const events = createEvents()
    const view = new EventTickPositionView(() => events)
    view.setPosition(-10)

    const event = view.getEvent()
    expect(event).toBeUndefined()
  })

  it("should return the most recent event when multiple events are before the position", () => {
    const events = createEvents()
    const view = new EventTickPositionView(() => events)
    view.setPosition(250)

    const event = view.getEvent()
    expect(event).toEqual({ tick: 200, value: 30 })
  })

  it("should return the last event when position is after all events", () => {
    const events = createEvents()
    const view = new EventTickPositionView(() => events)
    view.setPosition(1000)

    const event = view.getEvent()
    expect(event).toEqual({ tick: 300, value: 40 })
  })

  it("should update the event when position changes", () => {
    const events = createEvents()
    const view = new EventTickPositionView(() => events)

    view.setPosition(150)
    expect(view.getEvent()).toEqual({ tick: 100, value: 20 })

    view.setPosition(250)
    expect(view.getEvent()).toEqual({ tick: 200, value: 30 })
  })

  it("should not trigger updates when position is set to the same value", () => {
    const events = createEvents()
    const view = new EventTickPositionView(() => events)
    const callback = jest.fn()

    view.subscribe(callback)
    view.setPosition(100)

    const callCount = callback.mock.calls.length

    view.setPosition(100) // Same value
    expect(callback).toHaveBeenCalledTimes(callCount)
  })

  it("should notify subscribers when the event changes", () => {
    const events = createEvents()
    const view = new EventTickPositionView(() => events)
    const callback = jest.fn()

    view.subscribe(callback)
    view.setPosition(100)

    expect(callback).toHaveBeenCalled()
  })

  it("should handle empty event list", () => {
    const view = new EventTickPositionView<TestEvent>(() => [])
    view.setPosition(100)

    const event = view.getEvent()
    expect(event).toBeUndefined()
  })

  it("should unsubscribe correctly", () => {
    const events = createEvents()
    const view = new EventTickPositionView(() => events)
    const callback = jest.fn()

    const unsubscribe = view.subscribe(callback)
    view.setPosition(100)

    const callCountAfterFirst = callback.mock.calls.length

    unsubscribe()
    view.setPosition(200)

    expect(callback).toHaveBeenCalledTimes(callCountAfterFirst)
  })

  it("should dispose correctly", () => {
    const events = createEvents()
    const view = new EventTickPositionView(() => events)
    const callback = jest.fn()

    view.subscribe(callback)
    view.setPosition(100)

    const callCountBeforeDispose = callback.mock.calls.length

    view.dispose()
    view.setPosition(200)

    // Callback should not be called after dispose
    expect(callback).toHaveBeenCalledTimes(callCountBeforeDispose)
  })

  it("should support Symbol.dispose", () => {
    const events = createEvents()
    const view = new EventTickPositionView(() => events)
    const callback = jest.fn()

    view.subscribe(callback)
    view.setPosition(100)

    const callCountBeforeDispose = callback.mock.calls.length

    view[Symbol.dispose]()
    view.setPosition(200)

    // Callback should not be called after dispose
    expect(callback).toHaveBeenCalledTimes(callCountBeforeDispose)
  })

  it("should work with dynamically changing event lists", () => {
    let events = createEvents()
    const view = new EventTickPositionView(() => events)

    view.setPosition(150)
    expect(view.getEvent()).toEqual({ tick: 100, value: 20 })

    // Add a new event
    events = [...events, { tick: 125, value: 25 }]
    view.setPosition(150) // Trigger recomputation

    expect(view.getEvent()).toEqual({ tick: 125, value: 25 })
  })

  it("should use lastEvent getter", () => {
    const events = createEvents()
    const view = new EventTickPositionView(() => events)
    view.setPosition(150)

    expect(view.lastEvent).toEqual({ tick: 100, value: 20 })
    expect(view.lastEvent).toEqual(view.getEvent())
  })
})
