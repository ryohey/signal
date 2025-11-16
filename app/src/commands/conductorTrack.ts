import { clamp } from "lodash"
import { SetTempoEvent } from "midifile-ts"
import { isNotUndefined } from "../helpers/array"
import { bpmToUSecPerBeat, uSecPerBeatToBPM } from "../helpers/bpm"
import { SongStore } from "../stores/SongStore"
import { TrackEventOf } from "../track"
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
}
