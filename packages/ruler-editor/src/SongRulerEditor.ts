import {
  isTimeSignatureEvent,
  Measure,
  Track,
  TrackEventOf,
  timeSignatureMidiEvent,
} from "@signal-app/core"
import { Unsubscribe } from "@signal-app/observable"
import { TimeSignatureEvent } from "midifile-ts"
import { TimeSignatureItem } from "./entities"

export interface MeasureProvider {
  measures: readonly Measure[]
  timebase: number
}

// Time signatures live on the conductor track, but where a measure starts
// depends on song-wide values (timebase and every time signature before it),
// so the editor wraps the song rather than a single track.
export class SongRulerEditor {
  constructor(
    private readonly song: MeasureProvider,
    private readonly conductorTrack: Track,
  ) {}

  getTimeSignatures = (): readonly TimeSignatureItem[] =>
    this.conductorTrack.timeSignatureEvents

  getMeasureStartTick = (tick: number): number =>
    Measure.getMeasureStart(this.song.measures, tick, this.song.timebase).tick

  hasTimeSignatureAt = (tick: number): boolean =>
    this.getTimeSignatures().some((e) => e.tick === tick)

  // Snaps to the start of the measure containing `tick`. Returns null when a
  // time signature already exists there.
  addTimeSignature = (
    tick: number,
    numerator: number,
    denominator: number,
  ): TimeSignatureItem | null => {
    const track = this.conductorTrack
    const measureStartTick = this.getMeasureStartTick(tick)
    if (track === undefined || this.hasTimeSignatureAt(measureStartTick)) {
      return null
    }
    const event = track.addEvent<TrackEventOf<TimeSignatureEvent>>({
      ...timeSignatureMidiEvent(0, numerator, denominator),
      tick: measureStartTick,
    })
    return event
  }

  updateTimeSignature = (
    id: number,
    numerator: number,
    denominator: number,
  ): void => {
    const track = this.conductorTrack
    const event = track?.getEventById(id)
    if (track === undefined || event === undefined) {
      return
    }
    if (!isTimeSignatureEvent(event)) {
      return
    }
    track.updateEvent(id, { numerator, denominator })
  }

  removeTimeSignatures = (ids: readonly number[]): void => {
    this.conductorTrack.removeEvents(ids)
  }

  observeTimeSignatures = (listener: () => void): Unsubscribe =>
    this.conductorTrack.onTimeSignatureEventsChanged.subscribe(listener)
}
