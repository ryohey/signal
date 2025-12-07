import { min } from "lodash"
import { transaction } from "mobx"
import type { ControlEventsClipboardData } from "../entities/clipboard/clipboardTypes"
import type { TrackId } from "../entities/track/Track"
import { isNotUndefined } from "../helpers"
import type { ISongStore } from "./interfaces"

export class ControlCommandService {
  constructor(private readonly songStore: ISongStore) {}

  getClipboardDataForSelection = (
    trackId: TrackId,
    eventIds: number[]
  ): ControlEventsClipboardData | null => {
    const track = this.songStore.song.getTrack(trackId)
    if (!track) {
      return null
    }

    // Copy selected events
    const events = eventIds
      .map((id) => track.getEventById(id))
      .filter(isNotUndefined)

    const minTick = min(events.map((e) => e.tick))

    if (minTick === undefined) {
      return null
    }

    const relativePositionedEvents = events.map((note) => ({
      ...note,
      tick: note.tick - minTick,
    }))

    return {
      type: "control_events",
      events: relativePositionedEvents,
    }
  }

  pasteClipboardDataAtPosition = (
    trackId: TrackId,
    data: ControlEventsClipboardData,
    position: number
  ) => {
    const track = this.songStore.song.getTrack(trackId)
    if (!track) {
      return
    }

    const events = data.events.map((e) => ({
      ...e,
      tick: e.tick + position,
    }))
    transaction(() => events.forEach((e) => track.createOrUpdate(e)))
  }
}
