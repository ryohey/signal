import { clamp, min } from "lodash"
import { SetTempoEvent } from "midifile-ts"
import { transaction } from "mobx"
import {
  isSetTempoEvent,
  Measure,
  TempoEventsClipboardData,
  TrackEventOf,
} from "../entities"
import { bpmToUSecPerBeat, uSecPerBeatToBPM } from "../helpers"
import { isNotUndefined } from "../helpers/array"
import { timeSignatureMidiEvent } from "../midi"
import { ISongStore } from "./interfaces"
import { TrackCommandService } from "./TrackCommandService"

export class ConductorTrackCommandService {
  private readonly trackCommands: TrackCommandService

  constructor(private readonly songStore: ISongStore) {
    this.trackCommands = new TrackCommandService(songStore)
  }

  duplicateEvents = (eventIds: number[]) => {
    const conductorTrack = this.songStore.song.conductorTrack
    if (!conductorTrack) {
      return []
    }
    return this.trackCommands.duplicateEvents(conductorTrack.id, eventIds)
  }

  moveTempoEvents = (
    eventIds: number[],
    deltaTick: number,
    deltaValue: number,
    maxBPM: number,
  ) => {
    const conductorTrack = this.songStore.song.conductorTrack
    if (!conductorTrack) {
      return
    }
    const events = eventIds
      .map(
        (id) =>
          conductorTrack.getEventById(
            id,
          ) as unknown as TrackEventOf<SetTempoEvent>,
      )
      .filter(isNotUndefined)

    conductorTrack.updateEvents(
      events.map((ev) => ({
        id: ev.id,
        tick: Math.max(0, Math.floor(ev.tick + deltaTick)),
        microsecondsPerBeat: Math.floor(
          bpmToUSecPerBeat(
            clamp(
              uSecPerBeatToBPM(ev.microsecondsPerBeat) + deltaValue,
              0,
              maxBPM,
            ),
          ),
        ),
      })),
    )
  }

  removeRedundantEventsForEventIds = (eventIds: number[]) => {
    const conductorTrack = this.songStore.song.conductorTrack
    if (!conductorTrack) {
      return
    }
    return this.trackCommands.removeRedundantEventsForEventIds(
      conductorTrack.id,
      eventIds,
    )
  }

  copyTempoEvents = (eventIds: number[]): TempoEventsClipboardData | null => {
    const conductorTrack = this.songStore.song.conductorTrack
    if (!conductorTrack) {
      return null
    }

    // Copy selected events
    const events = eventIds
      .map((id) => conductorTrack.getEventById(id))
      .filter(isNotUndefined)
      .filter(isSetTempoEvent)

    const minTick = min(events.map((e) => e.tick))

    if (minTick === undefined) {
      return null
    }

    const relativePositionedEvents = events.map((note) => ({
      ...note,
      tick: note.tick - minTick,
    }))

    return {
      type: "tempo_events",
      events: relativePositionedEvents,
    }
  }

  pasteTempoEventsAt = (data: TempoEventsClipboardData, tick: number) => {
    const conductorTrack = this.songStore.song.conductorTrack
    if (!conductorTrack) {
      return []
    }
    const events = data.events.map((e) => ({
      ...e,
      tick: e.tick + tick,
    }))
    transaction(() => {
      events.forEach((e) => conductorTrack.createOrUpdate(e))
    })
  }

  getMeasureStartTick = (tick: number) => {
    const { timebase, measures } = this.songStore.song
    return Measure.getMeasureStart(measures, tick, timebase).tick
  }

  hasTimeSignatureAt = (tick: number) => {
    const { timeSignatures } = this.songStore.song
    return timeSignatures.some((e) => e.tick === tick)
  }

  addTimeSignature = (tick: number, numerator: number, denominator: number) => {
    const conductorTrack = this.songStore.song.conductorTrack
    return conductorTrack?.addEvent({
      ...timeSignatureMidiEvent(0, numerator, denominator),
      tick,
    })
  }
}
