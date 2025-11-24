import { action, computed, makeObservable, observable, observe } from "mobx"
import { Unsubscribe } from "../types"

interface TrackEvent {
  tick: number
}

/**
 * EventTickPositionView provides a reactive way to get the last event
 * at or before a specified tick position.
 *
 * Similar to EventView, but instead of filtering events in a range,
 * it finds the last event at or before a specific tick position.
 *
 * Used in places like useVolumeSlider to get the current control value
 * at the playback position.
 */
export class EventTickPositionView<T extends TrackEvent> {
  private tick: number = 0
  private listeners: Set<() => void> = new Set()
  private unregisterReaction: Unsubscribe | null = null

  constructor(private readonly loadEvents: () => readonly T[]) {
    makeObservable<EventTickPositionView<T>, "tick">(this, {
      tick: observable,
      lastEvent: computed({ keepAlive: false }),
      setPosition: action,
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
      "lastEvent",
      this.notifyListeners,
    )
  }

  /**
   * Returns the last event at or before the current tick position.
   * Returns undefined if no event exists at or before the position.
   */
  get lastEvent(): T | undefined {
    const events = this.loadEvents()
    const eventsBeforeTick = events.filter((e) => e.tick <= this.tick)

    if (eventsBeforeTick.length === 0) {
      return undefined
    }

    // Find the event with the maximum tick value
    return eventsBeforeTick.reduce((latest, current) =>
      current.tick > latest.tick ? current : latest
    )
  }

  /**
   * Sets the tick position to query events at.
   */
  setPosition = (tick: number) => {
    if (this.tick === tick) {
      return
    }
    this.tick = tick
  }

  /**
   * Returns the last event at or before the current tick position.
   * Alias for the lastEvent getter for consistency with EventView.getEvents().
   */
  getEvent = (): T | undefined => {
    return this.lastEvent
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
