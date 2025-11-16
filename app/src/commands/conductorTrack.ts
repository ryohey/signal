import {
  bpmToUSecPerBeat,
  isSetTempoEvent,
  TrackEventOf,
  uSecPerBeatToBPM,
} from "@signal-app/core"
import { clamp, min } from "lodash"
import { SetTempoEvent } from "midifile-ts"
import { transaction } from "mobx"
import { TempoEventsClipboardData } from "../clipboard/clipboardTypes"
import { isNotUndefined } from "../helpers/array"
import { SongStore } from "../stores/SongStore"
import { TrackCommandService } from "./track"

export class ConductorTrackCommandService {
  private readonly trackCommands: TrackCommandService

  constructor(private readonly songStore: SongStore) {
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
}
