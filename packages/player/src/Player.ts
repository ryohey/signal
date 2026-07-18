import { type Observable, ObservableValue } from "@signal-app/observable"
import range from "lodash/range.js"
import throttle from "lodash/throttle.js"
import { AnyEvent, MIDIControlEvents } from "midifile-ts"
import { EventScheduler } from "./EventScheduler.js"
import { controllerMidiEvent, gsResetMidiEvent } from "./MidiEventFactory.js";
import { PlayerEvent } from "./PlayerEvent.js"
import { SendableEvent, SynthOutput } from "./SynthOutput.js"
import { DistributiveOmit } from "./types.js"

export interface LoopSetting {
  begin: number
  end: number
  enabled: boolean
}

const TIMER_INTERVAL = 50
const LOOK_AHEAD_TIME = 50
export const DEFAULT_TEMPO = 120

export interface IEventSource {
  timebase: number
  endOfSong: number
  getEvents(startTick: number, endTick: number): PlayerEvent[]
  getCurrentStateEvents(tick: number): SendableEvent[]
}

export class Player {
  private scheduler: EventScheduler<PlayerEvent> | null = null
  private interval: number | null = null

  private readonly _currentTempo = new ObservableValue(DEFAULT_TEMPO)
  private readonly _currentTick = new ObservableValue(0)
  private readonly _isPlaying = new ObservableValue(false)
  private readonly _loop = new ObservableValue<LoopSetting | null>(null)

  disableSeek: boolean = false

  readonly onPositionChanged: Observable
  readonly onIsPlayingChanged: Observable
  readonly onLoopChanged: Observable

  constructor(
    private readonly output: SynthOutput,
    private readonly eventSource: IEventSource,
  ) {
    this.onPositionChanged = this._currentTick.onChanged
    this.onIsPlayingChanged = this._isPlaying.onChanged
    this.onLoopChanged = this._loop.onChanged
  }

  play = () => {
    if (this.isPlaying) {
      console.warn("called play() while playing. aborted.")
      return
    }
    this.scheduler = new EventScheduler<PlayerEvent>(
      (startTick, endTick) => this.eventSource.getEvents(startTick, endTick),
      () => this.allNotesOffEvents(),
      this._currentTick.value,
      this.eventSource.timebase,
      TIMER_INTERVAL + LOOK_AHEAD_TIME,
    )
    this._isPlaying.set(true)
    this.output.activate()
    this.interval = window.setInterval(() => this._onTimer(), TIMER_INTERVAL)
    this.output.activate()
  }

  set position(tick: number) {
    if (!Number.isInteger(tick)) {
      console.warn("Player.tick should be an integer", tick)
    }
    if (this.disableSeek) {
      return
    }
    tick = Math.min(Math.max(Math.floor(tick), 0), this.eventSource.endOfSong)
    if (this.scheduler) {
      this.scheduler.seek(tick)
    }
    this._currentTick.set(tick)

    if (this.isPlaying) {
      this.allSoundsOff()
    }

    this.sendCurrentStateEvents()
  }

  get position() {
    return this._currentTick.value
  }

  get isPlaying() {
    return this._isPlaying.value
  }

  get loop(): LoopSetting | null {
    return this._loop.value
  }

  set loop(value: LoopSetting | null) {
    this._loop.set(value)
  }

  get numberOfChannels() {
    return 16
  }

  allSoundsOffChannel = (ch: number) => {
    this.sendEvent(
      controllerMidiEvent(0, ch, MIDIControlEvents.ALL_SOUNDS_OFF, 0),
    )
  }

  allSoundsOff = () => {
    for (const ch of range(0, this.numberOfChannels)) {
      this.allSoundsOffChannel(ch)
    }
  }

  allSoundsOffExclude = (channel: number) => {
    for (const ch of range(0, this.numberOfChannels)) {
      if (ch !== channel) {
        this.allSoundsOffChannel(ch)
      }
    }
  }

  private allNotesOffEvents(): DistributiveOmit<PlayerEvent, "tick">[] {
    return range(0, this.numberOfChannels).map((ch) => ({
      ...controllerMidiEvent(0, ch, MIDIControlEvents.ALL_NOTES_OFF, 0),
      trackId: -1, // do not mute
    }))
  }

  private resetControllers() {
    // RP-15 controller reset (it does not do a full reset)
    for (const ch of range(0, this.numberOfChannels)) {
      this.sendEvent(
        controllerMidiEvent(0, ch, MIDIControlEvents.RESET_CONTROLLERS, 0x7f),
      )
    }
    // Full GS reset
    this.sendEvent(gsResetMidiEvent(
        0,
        [
          0x41, // Roland
          0x10, // Device ID (defaults to 16 on Roland)
          0x42, // GS
          0x12, // Command ID (DT1)
          0x40, // System parameter - Address
          0x00, // Global parameter -  Address
          0x7f, // GS Change - Address
          0x00, // Turn on - Data
          0x41, // Checksum
          0xf7  // End of exclusive
        ]
    ))
  }

  stop = () => {
    this.scheduler = null
    this.allSoundsOff()
    this._isPlaying.set(false)

    if (this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  reset = () => {
    this.resetControllers()
    this.stop()
    this._currentTick.set(0)
  }

  /*
   to restore synthesizer state (e.g. pitch bend)
   collect all previous state events
   and send them to the synthesizer
  */
  sendCurrentStateEvents = () => {
    this.eventSource
      .getCurrentStateEvents(this._currentTick.value)
      .forEach((e) => {
        this.applyPlayerEvent(e)
        this.sendEvent(e)
      })
  }

  get currentTempo() {
    return this._currentTempo.value
  }

  set currentTempo(value: number) {
    this._currentTempo.set(value)
  }

  // delayTime: seconds, timestampNow: milliseconds
  sendEvent = (
    event: SendableEvent,
    delayTime: number = 0,
    timestampNow: number = performance.now(),
    trackId?: number,
  ) => {
    this.output.sendEvent(event, delayTime, timestampNow, trackId)
  }

  private syncPosition = throttle(() => {
    if (this.scheduler !== null) {
      this._currentTick.set(this.scheduler.scheduledTick)
    }
  }, 50)

  private applyPlayerEvent(
    e: DistributiveOmit<AnyEvent, "deltaTime" | "channel">,
  ) {
    if (e.type !== "channel" && "subtype" in e) {
      switch (e.subtype) {
        case "setTempo":
          this._currentTempo.set(60000000 / e.microsecondsPerBeat)
          break
        default:
          break
      }
    }
  }

  private _onTimer() {
    if (this.scheduler === null) {
      return
    }

    const timestamp = performance.now()

    this.scheduler.loop = this.loop?.enabled ? this.loop : null
    const events = this.scheduler.readNextEvents(
      this._currentTempo.value,
      timestamp,
    )

    events.forEach(({ event: e, timestamp: time }) => {
      if (
        e.type === "channel" ||
        e.type === "sysEx" ||
        e.type === "dividedSysEx"
      ) {
        const delayTime = (time - timestamp) / 1000
        this.sendEvent(e, delayTime, timestamp, e.trackId)
      } else {
        this.applyPlayerEvent(e)
      }
    })

    if (this.scheduler.scheduledTick >= this.eventSource.endOfSong) {
      this.stop()
    }

    this.syncPosition()
  }

  // convenience methods

  playOrPause = () => {
    if (this.isPlaying) {
      this.stop()
    } else {
      this.play()
    }
  }

  setLoopBegin = (tick: number) => {
    this.loop = {
      end: Math.max(tick, this.loop?.end ?? tick),
      enabled: this.loop?.enabled ?? false,
      begin: tick,
    }
  }

  setLoopEnd = (tick: number) => {
    this.loop = {
      begin: Math.min(tick, this.loop?.begin ?? tick),
      enabled: this.loop?.enabled ?? false,
      end: tick,
    }
  }

  toggleEnableLoop = () => {
    if (this.loop === null) {
      return
    }
    this.loop = { ...this.loop, enabled: !this.loop.enabled }
  }
}
