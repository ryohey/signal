import { Range } from "@signal-app/core"
import { computed, makeObservable, observable, observe } from "mobx"
import { Unsubscribe } from "../types"

interface TrackEvent {
  tick: number
}

export class EventView<T extends TrackEvent> {
  private startTick: number = 0
  private endTick: number = 0
  private listeners: Set<() => void> = new Set()
  private unregisterReaction: Unsubscribe | null = null

  constructor(private readonly loadEvents: () => readonly T[]) {
    makeObservable<EventView<T>, "startTick" | "endTick">(this, {
      startTick: observable,
      endTick: observable,
      windowedEvents: computed({ keepAlive: false }),
    })
  }

  dispose() {
    this.unregisterReaction?.()
    this.unregisterReaction = null
    this.listeners.clear()
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  private registerReaction = () => {
    this.unregisterReaction?.()
    this.unregisterReaction = observe(
      this,
      "windowedEvents",
      this.notifyListeners,
    )
  }

  get windowedEvents(): readonly T[] {
    const range = Range.create(this.startTick, this.endTick)

    return this.loadEvents().filter((e) => {
      if ("duration" in e && typeof e.duration === "number") {
        return Range.intersects(
          range,
          Range.fromLength(e.tick, e.tick + e.duration),
        )
      }
      return Range.contains(range, e.tick)
    })
  }

  setRange = (startTick: number, endTick: number) => {
    if (this.startTick === startTick && this.endTick === endTick) {
      return
    }
    this.startTick = startTick
    this.endTick = endTick
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
