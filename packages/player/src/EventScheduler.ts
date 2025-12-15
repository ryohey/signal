import { tickToMillisec } from "./tick.js"

export type SchedulableEvent = {
  tick: number
}

export interface EventSchedulerLoop {
  begin: number
  end: number
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
  private _getEvents: (startTick: number, endTick: number) => E[]
  private _createLoopEndEvents: () => Omit<E, "tick">[]

  constructor(
    getEvents: (startTick: number, endTick: number) => E[],
    createLoopEndEvents: () => Omit<E, "tick">[],
    tick = 0,
    timebase = 480,
    lookAheadTime = 100,
  ) {
    this._getEvents = getEvents
    this._createLoopEndEvents = createLoopEndEvents
    this._currentTick = tick
    this._scheduledTick = tick
    this.timebase = timebase
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

  readNextEvents(bpm: number, timestamp: number): WithTimestamp<E>[] {
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
    ) => this._getEvents(startTick, endTick).map(withTimestamp(currentTick))

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

      return [
        ...getEventsInRange(startTick, loop.end, nowTick),
        ...this._createLoopEndEvents().map((e) =>
          withTimestamp(currentTick)({ ...e, tick: loop.begin } as E),
        ),
        ...getEventsInRange(loop.begin, endTick2, currentTick),
      ]
    } else {
      this._currentTick = nowTick
      this._scheduledTick = endTick

      return getEventsInRange(startTick, endTick, nowTick)
    }
  }
}
