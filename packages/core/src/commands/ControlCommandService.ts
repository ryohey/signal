import { min } from "lodash"
import { transaction } from "mobx"
import { ControlEventsClipboardData } from "../entities/clipboard/clipboardTypes"
import { Track } from "../entities/track/Track"
import { isNotUndefined } from "../helpers"
import type { ISongStore } from "./interfaces"
import { createBindTrack } from "./TrackCommandService"

const getClipboardDataForSelection =
  (track: Track) =>
  (eventIds: number[]): ControlEventsClipboardData | null => {
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

const pasteClipboardDataAtPosition =
  (track: Track) => (data: ControlEventsClipboardData, position: number) => {
    const events = data.events.map((e) => ({
      ...e,
      tick: e.tick + position,
    }))
    transaction(() => events.forEach((e) => track.createOrUpdate(e)))
  }

export function createControlCommandService(songStore: ISongStore) {
  const bindTrack = createBindTrack(songStore)

  return {
    getClipboardDataForSelection: bindTrack(getClipboardDataForSelection),
    pasteClipboardDataAtPosition: bindTrack(pasteClipboardDataAtPosition),
  }
}

export type ControlCommandService = ReturnType<
  typeof createControlCommandService
>
