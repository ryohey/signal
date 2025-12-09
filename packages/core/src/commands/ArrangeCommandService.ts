import { mapValues } from "lodash"
import { transaction } from "mobx"
import {
  type ArrangeNotesClipboardData,
  Range,
  type TrackEvent,
} from "../entities"
import type { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import type { ArrangePoint } from "../entities/transform/ArrangePoint"
import { isNotUndefined } from "../helpers/array"
import { isEventInRange } from "../helpers/filterEvents"
import type { ISongStore } from "./interfaces"
import {
  type BatchUpdateOperation,
  TrackCommandService,
} from "./TrackCommandService"

export class ArrangeCommandService {
  private readonly trackCommands: TrackCommandService

  constructor(private readonly songStore: ISongStore) {
    this.trackCommands = new TrackCommandService(songStore)
  }

  // returns moved event ids
  moveEventsBetweenTracks = (
    eventIdForTrackIndex: { [trackIndex: number]: number[] },
    delta: ArrangePoint
  ) => {
    const { tracks } = this.songStore.song
    return transaction(() => {
      const updates = []
      for (const [trackIndexStr, selectedEventIdsValue] of Object.entries(
        eventIdForTrackIndex
      )) {
        const trackIndex = parseInt(trackIndexStr, 10)
        const track = tracks[trackIndex]
        const events = selectedEventIdsValue
          .map((id) => track.getEventById(id))
          .filter(isNotUndefined)

        if (delta.trackIndex === 0) {
          track.updateEvents(
            events.map((e) => ({
              id: e.id,
              tick: e.tick + delta.tick,
            }))
          )
        } else {
          updates.push({
            sourceTrackIndex: trackIndex,
            destinationTrackIndex: trackIndex + delta.trackIndex,
            events: events.map((e) => ({
              ...e,
              tick: e.tick + delta.tick,
            })),
          })
        }
      }
      if (delta.trackIndex !== 0) {
        const ids: { [trackIndex: number]: number[] } = {}
        for (const u of updates) {
          tracks[u.sourceTrackIndex].removeEvents(u.events.map((e) => e.id))
          const events = tracks[u.destinationTrackIndex].addEvents(u.events)
          ids[u.destinationTrackIndex] = events.map((e: TrackEvent) => e.id)
        }
        return ids
      }

      return eventIdForTrackIndex
    })
  }

  batchUpdateNotesVelocity = (
    selection: ArrangeSelection,
    operation: BatchUpdateOperation
  ) => {
    const { tracks } = this.songStore.song
    const eventIdForTrackIndex = this.getEventsInSelection(selection)
    transaction(() => {
      for (const [trackIndexStr, selectedEventIdsValue] of Object.entries(
        eventIdForTrackIndex
      )) {
        const trackIndex = parseInt(trackIndexStr, 10)
        const track = tracks[trackIndex]
        this.trackCommands.batchUpdateNotesVelocity(
          track.id,
          selectedEventIdsValue,
          operation
        )
      }
    })
  }

  duplicateSelection = (selection: ArrangeSelection): ArrangeSelection => {
    const { tracks } = this.songStore.song

    const deltaTick = selection.toTick - selection.fromTick
    const selectedEventIds = this.getEventsInSelection(selection)

    transaction(() => {
      for (const [trackIndexStr, eventIds] of Object.entries(
        selectedEventIds
      )) {
        const trackIndex = parseInt(trackIndexStr, 10)
        const track = tracks[trackIndex]
        const events = eventIds
          .map((id) => track.getEventById(id))
          .filter(isNotUndefined)

        track.addEvents(
          events.map((e) => ({
            ...e,
            tick: e.tick + deltaTick,
          }))
        )
      }
    })

    return {
      fromTick: selection.fromTick + deltaTick,
      fromTrackIndex: selection.fromTrackIndex,
      toTick: selection.toTick + deltaTick,
      toTrackIndex: selection.toTrackIndex,
    }
  }

  deleteSelection = (selection: ArrangeSelection) => {
    const selectedEventIds = this.getEventsInSelection(selection)
    const { tracks } = this.songStore.song
    transaction(() => {
      for (const trackIndex in selectedEventIds) {
        tracks[trackIndex].removeEvents(selectedEventIds[trackIndex])
      }
    })
  }

  transposeSelection = (selection: ArrangeSelection, deltaPitch: number) => {
    const selectedEventIds = this.getEventsInSelection(selection)
    const { tracks } = this.songStore.song

    transaction(() => {
      for (const trackIndexStr in selectedEventIds) {
        const trackIndex = parseInt(trackIndexStr, 10)
        const eventIds = selectedEventIds[trackIndex]
        const track = tracks[trackIndex]
        if (track === undefined) {
          continue
        }
        this.trackCommands.transposeNotes(track.id, eventIds, deltaPitch)
      }
    })
  }

  getClipboardDataForSelection = (
    selection: ArrangeSelection
  ): ArrangeNotesClipboardData => {
    const selectedEventIds = this.getEventsInSelection(selection)
    const { tracks } = this.songStore.song

    const notes = mapValues(selectedEventIds, (ids, trackIndex) => {
      const track = tracks[parseInt(trackIndex, 10)]
      return ids
        .map((id) => track.getEventById(id))
        .filter(isNotUndefined)
        .map((note) => ({
          ...note,
          tick: note.tick - selection.fromTick,
        }))
    })
    return {
      type: "arrange_notes",
      notes,
      selectedTrackIndex: selection.fromTrackIndex,
    }
  }

  pasteClipboardDataAt = (
    data: ArrangeNotesClipboardData,
    position: number,
    selectedTrackIndex: number
  ) => {
    const { tracks } = this.songStore.song

    transaction(() => {
      for (const trackIndex in data.notes) {
        const notes = data.notes[trackIndex].map((note) => ({
          ...note,
          tick: note.tick + position,
        }))

        const isRulerSelected = selectedTrackIndex < 0
        const trackNumberOffset = isRulerSelected
          ? 0
          : -data.selectedTrackIndex + selectedTrackIndex

        const destTrackIndex = parseInt(trackIndex, 10) + trackNumberOffset

        if (destTrackIndex < tracks.length) {
          tracks[destTrackIndex].addEvents(notes)
        }
      }
    })
  }

  // returns { trackIndex: [eventId] }
  getEventsInSelection = (selection: ArrangeSelection) => {
    const { tracks } = this.songStore.song
    const ids: { [key: number]: number[] } = {}
    for (
      let trackIndex = selection.fromTrackIndex;
      trackIndex < selection.toTrackIndex;
      trackIndex++
    ) {
      const track = tracks[trackIndex]
      const events = track.events.filter(
        isEventInRange(Range.create(selection.fromTick, selection.toTick))
      )
      ids[trackIndex] = events.map((e: TrackEvent) => e.id)
    }
    return ids
  }

  hasSelectionNotes = (selection: ArrangeSelection) => {
    const selectedEventIds = this.getEventsInSelection(selection)
    return Object.values(selectedEventIds).some((ids) => ids.length > 0)
  }
}
