import { tickToMillisec } from "./tick.js"

export type SchedulableEvent = {
  tick: number
}

export interface EventSchedulerLoop {
  begin: number
  end: number
}

export interface EventSchedulerSource<E extends SchedulableEvent> {
  timebase: number
  endOfSong: number
  getEvents(startTick: number, endTick: number): readonly E[]
}

export interface SchedulerResult<E extends SchedulableEvent> {
  events: readonly WithTimestamp<E>[]
  shouldStop: boolean
}

type WithTimestamp<E> = {
  event: E
  timestamp: number
}

/**
 * Class for reading chronological events.
 * Perform lookahead to schedule accurately.
 * https://www.html5rocks.com/ja/tutorials/audio/scheduling/
 */
export class EventScheduler<E extends SchedulableEvent> {
  lookAheadTime = 100

  // Number of ticks per 1/4 beat
  timebase = 480

  loop: EventSchedulerLoop | null = null

  private _currentTick = 0
  private _scheduledTick = 0
  private _prevTime: number | undefined = undefined
  private _createLoopEndEvents: () => readonly Omit<E, "tick">[]
  private _stopEvents: Omit<E, "tick">[] | null = null

  constructor(
    private readonly eventSource: EventSchedulerSource<E>,
    createLoopEndEvents: () => readonly Omit<E, "tick">[],
    tick = 0,
    lookAheadTime = 100,
  ) {
    this._createLoopEndEvents = createLoopEndEvents
    this._currentTick = tick
    this._scheduledTick = tick
    this.timebase = this.eventSource.timebase
    this.lookAheadTime = lookAheadTime
  }

  get scheduledTick() {
    return this._scheduledTick
  }

  millisecToTick(ms: number, bpm: number) {
    return (((ms / 1000) * bpm) / 60) * this.timebase
  }

  seek(tick: number) {
    this._currentTick = this._scheduledTick = Math.max(0, tick)
  }

  /**
   * Queue events (e.g. all-sounds-off) to be sent on the next readNextEvents
   * call instead of immediately. This ensures they are scheduled with a
   * timestamp at least as far ahead as the look-ahead window used for
   * already-dispatched events, so they can't be scheduled to happen before
   * a note-on that was sent moments earlier.
   */
  scheduleStop(events: Omit<E, "tick">[]) {
    this._stopEvents = events
  }

  readNextEvents(bpm: number, timestamp: number): SchedulerResult<E> {
    const withTimestamp =
      (currentTick: number) =>
      (e: E): WithTimestamp<E> => {
        const waitTick = e.tick - currentTick
        const delayedTime =
          timestamp + Math.max(0, tickToMillisec(waitTick, bpm, this.timebase))
        return { event: e, timestamp: delayedTime }
      }

    const getEventsInRange = (
      startTick: number,
      endTick: number,
      currentTick: number,
    ) =>
      this.eventSource
        .getEvents(startTick, endTick)
        .map(withTimestamp(currentTick))

    if (this._prevTime === undefined) {
      this._prevTime = timestamp
    }
    const delta = timestamp - this._prevTime
    const deltaTick = Math.max(0, this.millisecToTick(delta, bpm))
    const nowTick = this._currentTick + deltaTick
    const lookAheadTick = this.millisecToTick(this.lookAheadTime, bpm)

    // Process from the last scheduled point to the lookahead time
    const startTick = this._scheduledTick
    const endTick = nowTick + lookAheadTick

    this._prevTime = timestamp

    if (this._stopEvents !== null) {
      const stopEvents = this._stopEvents
      this._stopEvents = null
      this._currentTick = nowTick
      this._scheduledTick = endTick

      const events = stopEvents.map((e) =>
        withTimestamp(nowTick)({ ...e, tick: endTick } as E),
      )
      return {
        events,
        shouldStop: true,
      }
    }

    if (
      this.loop !== null &&
      startTick < this.loop.end &&
      endTick >= this.loop.end
    ) {
      const loop = this.loop
      const offset = endTick - loop.end
      const endTick2 = loop.begin + offset
      const currentTick = loop.begin - (loop.end - nowTick)
      this._currentTick = currentTick
      this._scheduledTick = endTick2

      const events = [
        ...getEventsInRange(startTick, loop.end, nowTick),
        ...this._createLoopEndEvents().map((e) =>
          withTimestamp(currentTick)({ ...e, tick: loop.begin } as E),
        ),
        ...getEventsInRange(loop.begin, endTick2, currentTick),
      ]
      return {
        events,
        shouldStop: false,
      }
    } else {
      this._currentTick = nowTick
      this._scheduledTick = endTick

      return {
        events: getEventsInRange(startTick, endTick, nowTick),
        shouldStop: this._scheduledTick >= this.eventSource.endOfSong,
      }
    }
  }
}
