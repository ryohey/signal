import { Range } from "@signal-app/core"
import { Unsubscribe } from "../types"

interface TrackEvent {
  tick: number
}

export class EventView<T extends TrackEvent> {
  private startTick: number = 0
  private endTick: number = 0
  private listeners: Set<() => void> = new Set()
  private windowedEvents: readonly T[] = []

  constructor(private readonly loadEvents: () => readonly T[]) {}

  dispose() {
    this.listeners.clear()
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  triggerUpdate() {
    this.updateWindowedEvents()
  }

  private updateWindowedEvents() {
    const range = Range.create(this.startTick, this.endTick)

    this.windowedEvents = this.loadEvents().filter((e) => {
      if ("duration" in e && typeof e.duration === "number") {
        return Range.intersects(
          range,
          Range.fromLength(e.tick, e.tick + e.duration),
        )
      }
      return Range.contains(range, e.tick)
    })

    this.notifyListeners()
  }

  setRange = (startTick: number, endTick: number) => {
    if (this.startTick === startTick && this.endTick === endTick) {
      return
    }
    this.startTick = startTick
    this.endTick = endTick
    this.updateWindowedEvents()
  }

  getEvents = (): readonly T[] => {
    return this.windowedEvents
  }

  subscribe = (callback: () => void): Unsubscribe => {
    this.listeners.add(callback)
    if (this.listeners.size === 1) {
      this.updateWindowedEvents()
    }
    return () => {
      this.listeners.delete(callback)
      if (this.listeners.size === 0) {
        this.windowedEvents = []
      }
    }
  }

  private notifyListeners = () => {
    this.listeners.forEach((listener) => listener())
  }
}
