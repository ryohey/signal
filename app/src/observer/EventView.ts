import { reaction } from "mobx"
import { Range } from "../entities/geometry/Range"
import { Unsubscribe } from "../types"

interface TrackEvent {
  tick: number
}

export class EventView<T extends TrackEvent> {
  private startTick: number = 0
  private endTick: number = 0
  private events: readonly T[] = []
  private windowedEvents: readonly T[] = []
  private listeners: Set<() => void> = new Set()
  private unregisterReaction: Unsubscribe | null = null

  constructor(private readonly loadEvents: () => readonly T[]) {
    this.events = loadEvents()
    this.registerReaction()
  }

  private registerReaction = () => {
    this.unregisterReaction?.()
    this.unregisterReaction = reaction(this.loadEvents, (events) => {
      this.events = events
      this.updateEvents()
    })
  }

  private updateEvents = () => {
    const range = Range.create(this.startTick, this.endTick)

    this.windowedEvents = this.events.filter((e) => {
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
    this.updateEvents()
  }

  getEvents = (): readonly T[] => {
    return this.windowedEvents
  }

  subscribe = (callback: () => void): Unsubscribe => {
    this.listeners.add(callback)
    if (this.listeners.size === 1) {
      this.registerReaction()
    }
    return () => {
      this.listeners.delete(callback)
      if (this.listeners.size === 0) {
        this.unregisterReaction?.()
        this.unregisterReaction = null
      }
    }
  }

  private notifyListeners = () => {
    this.listeners.forEach((listener) => listener())
  }
}
