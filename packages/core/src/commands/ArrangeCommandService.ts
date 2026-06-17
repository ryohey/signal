import { mapValues } from "lodash"
import { transaction } from "mobx"
import {
  ArrangeNotesClipboardData,
  Range,
  Track,
  TrackEvent,
} from "../entities"
import { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import { ArrangePoint } from "../entities/transform/ArrangePoint"
import { isNotUndefined } from "../helpers/array"
import { isEventInRange } from "../helpers/filterEvents"
import { ISongStore } from "./interfaces"
import {
  BatchUpdateOperation,
  batchUpdateNotesVelocity as batchUpdateNotesVelocityForTrack,
  transposeNotes,
} from "./TrackCommandService"

// returns moved event ids
const moveEventsBetweenTracks =
  (tracks: readonly Track[]) =>
  (
    eventIdForTrackIndex: { [trackIndex: number]: number[] },
    delta: ArrangePoint,
  ) => {
    return transaction(() => {
      const updates = []
      for (const [trackIndexStr, selectedEventIdsValue] of Object.entries(
        eventIdForTrackIndex,
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
            })),
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

const batchUpdateNotesVelocity =
  (tracks: readonly Track[]) =>
  (selection: ArrangeSelection, operation: BatchUpdateOperation) => {
    const eventIdForTrackIndex = getEventsInSelection(tracks)(selection)
    transaction(() => {
      for (const [trackIndexStr, selectedEventIdsValue] of Object.entries(
        eventIdForTrackIndex,
      )) {
        const trackIndex = parseInt(trackIndexStr, 10)
        const track = tracks[trackIndex]
        batchUpdateNotesVelocityForTrack(track)(
          selectedEventIdsValue,
          operation,
        )
      }
    })
  }

const duplicateSelection =
  (tracks: readonly Track[]) =>
  (selection: ArrangeSelection): ArrangeSelection => {
    const deltaTick = selection.toTick - selection.fromTick
    const selectedEventIds = getEventsInSelection(tracks)(selection)

    transaction(() => {
      for (const [trackIndexStr, eventIds] of Object.entries(
        selectedEventIds,
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
          })),
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

const deleteSelection =
  (tracks: readonly Track[]) => (selection: ArrangeSelection) => {
    const selectedEventIds = getEventsInSelection(tracks)(selection)
    transaction(() => {
      for (const trackIndex in selectedEventIds) {
        tracks[trackIndex].removeEvents(selectedEventIds[trackIndex])
      }
    })
  }

const transposeSelection =
  (tracks: readonly Track[]) =>
  (selection: ArrangeSelection, deltaPitch: number) => {
    const selectedEventIds = getEventsInSelection(tracks)(selection)

    transaction(() => {
      for (const trackIndexStr in selectedEventIds) {
        const trackIndex = parseInt(trackIndexStr, 10)
        const eventIds = selectedEventIds[trackIndex]
        const track = tracks[trackIndex]
        if (track === undefined) {
          continue
        }
        transposeNotes(track)(eventIds, deltaPitch)
      }
    })
  }

const getClipboardDataForSelection =
  (tracks: readonly Track[]) =>
  (selection: ArrangeSelection): ArrangeNotesClipboardData => {
    const selectedEventIds = getEventsInSelection(tracks)(selection)

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

const pasteClipboardDataAt =
  (tracks: readonly Track[]) =>
  (
    data: ArrangeNotesClipboardData,
    position: number,
    selectedTrackIndex: number,
  ) => {
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
const getEventsInSelection =
  (tracks: readonly Track[]) => (selection: ArrangeSelection) => {
    const ids: { [key: number]: number[] } = {}
    for (
      let trackIndex = selection.fromTrackIndex;
      trackIndex < selection.toTrackIndex;
      trackIndex++
    ) {
      const track = tracks[trackIndex]
      const events = track.events.filter(
        isEventInRange(Range.create(selection.fromTick, selection.toTick)),
      )
      ids[trackIndex] = events.map((e: TrackEvent) => e.id)
    }
    return ids
  }

const hasSelectionNotes =
  (tracks: readonly Track[]) => (selection: ArrangeSelection) => {
    const selectedEventIds = getEventsInSelection(tracks)(selection)
    return Object.values(selectedEventIds).some((ids) => ids.length > 0)
  }

export function createArrangeCommandService(songStore: ISongStore) {
  function bindTracks<Args extends unknown[], Result>(
    command: (tracks: readonly Track[]) => (...args: Args) => Result,
  ): (...args: Args) => Result {
    return (...args: Args) => {
      return command(songStore.song.tracks)(...args)
    }
  }
  return {
    moveEventsBetweenTracks: bindTracks(moveEventsBetweenTracks),
    batchUpdateNotesVelocity: bindTracks(batchUpdateNotesVelocity),
    duplicateSelection: bindTracks(duplicateSelection),
    deleteSelection: bindTracks(deleteSelection),
    transposeSelection: bindTracks(transposeSelection),
    getClipboardDataForSelection: bindTracks(getClipboardDataForSelection),
    pasteClipboardDataAt: bindTracks(pasteClipboardDataAt),
    getEventsInSelection: bindTracks(getEventsInSelection),
    hasSelectionNotes: bindTracks(hasSelectionNotes),
  }
}

export type ArrangeCommandService = ReturnType<
  typeof createArrangeCommandService
>
