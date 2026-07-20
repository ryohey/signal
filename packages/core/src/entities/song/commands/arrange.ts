import { mapValues } from "lodash"
import { isEventInRange } from "../../../helpers/filterEvents"
import {
  ArrangeEventsClipboardData,
  BatchUpdateOperation,
  batchUpdateNotesVelocity,
  getEventsByIds,
  Range,
  Track,
  TrackEvent,
  transposeNotes,
} from "../.."
import { ArrangeSelection } from "../../selection/ArrangeSelection"
import { ArrangePoint } from "../../transform/ArrangePoint"
import { SongTracksCommand } from "./type"

const runTrackTransaction = <T>(tracks: readonly Track[], fn: () => T): T => {
  const runInAllTracks = (index: number): T => {
    if (index >= tracks.length) {
      return fn()
    }
    return tracks[index].transaction(() => runInAllTracks(index + 1))
  }

  return runInAllTracks(0)
}

// returns moved event ids
export const moveEventsBetweenTracks =
  (
    eventIdForTrackIndex: { [trackIndex: number]: number[] },
    delta: ArrangePoint,
  ): SongTracksCommand<{ [trackIndex: number]: number[] }> =>
  (tracks) => {
    return runTrackTransaction(tracks, () => {
      const updates = []
      for (const [trackIndexStr, selectedEventIdsValue] of Object.entries(
        eventIdForTrackIndex,
      )) {
        const trackIndex = parseInt(trackIndexStr, 10)
        const track = tracks[trackIndex]
        const events = track.query(getEventsByIds(selectedEventIdsValue))

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

export const batchUpdateArrangeNotesVelocity =
  (
    selection: ArrangeSelection,
    operation: BatchUpdateOperation,
  ): SongTracksCommand<void> =>
  (tracks) => {
    const eventIdForTrackIndex = getEventsInSelection(selection)(tracks)
    runTrackTransaction(tracks, () => {
      for (const [trackIndexStr, selectedEventIdsValue] of Object.entries(
        eventIdForTrackIndex,
      )) {
        const trackIndex = parseInt(trackIndexStr, 10)
        const track = tracks[trackIndex]
        track.mutate(batchUpdateNotesVelocity(selectedEventIdsValue, operation))
      }
    })
  }

export const duplicateSelection =
  (selection: ArrangeSelection): SongTracksCommand<ArrangeSelection> =>
  (tracks) => {
    const deltaTick = selection.toTick - selection.fromTick
    const selectedEventIds = getEventsInSelection(selection)(tracks)

    runTrackTransaction(tracks, () => {
      for (const [trackIndexStr, eventIds] of Object.entries(
        selectedEventIds,
      )) {
        const trackIndex = parseInt(trackIndexStr, 10)
        const track = tracks[trackIndex]
        const events = track.query(getEventsByIds(eventIds))

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

export const deleteSelection =
  (selection: ArrangeSelection): SongTracksCommand<void> =>
  (tracks) => {
    const selectedEventIds = getEventsInSelection(selection)(tracks)
    runTrackTransaction(tracks, () => {
      for (const trackIndex in selectedEventIds) {
        tracks[trackIndex].removeEvents(selectedEventIds[trackIndex])
      }
    })
  }

export const transposeSelection =
  (selection: ArrangeSelection, deltaPitch: number): SongTracksCommand<void> =>
  (tracks) => {
    const selectedEventIds = getEventsInSelection(selection)(tracks)

    runTrackTransaction(tracks, () => {
      for (const trackIndexStr in selectedEventIds) {
        const trackIndex = parseInt(trackIndexStr, 10)
        const eventIds = selectedEventIds[trackIndex]
        const track = tracks[trackIndex]
        if (track === undefined) {
          continue
        }
        track.mutate(transposeNotes(eventIds, deltaPitch))
      }
    })
  }

export const getArrangeClipboardDataForSelection =
  (
    selection: ArrangeSelection,
  ): SongTracksCommand<ArrangeEventsClipboardData> =>
  (tracks) => {
    const selectedEventIds = getEventsInSelection(selection)(tracks)

    const events = mapValues(selectedEventIds, (ids, trackIndex) => {
      const track = tracks[parseInt(trackIndex, 10)]
      return track.query(getEventsByIds(ids)).map((e) => ({
        ...e,
        tick: e.tick - selection.fromTick,
      }))
    })
    return {
      type: "arrange_events",
      events,
      selectedTrackIndex: selection.fromTrackIndex,
    }
  }

export const pasteClipboardDataAt =
  (
    data: ArrangeEventsClipboardData,
    position: number,
    selectedTrackIndex: number,
  ): SongTracksCommand<void> =>
  (tracks) => {
    runTrackTransaction(tracks, () => {
      for (const trackIndex in data.events) {
        const events = data.events[trackIndex].map((note) => ({
          ...note,
          tick: note.tick + position,
        }))

        const isRulerSelected = selectedTrackIndex < 0
        const trackNumberOffset = isRulerSelected
          ? 0
          : -data.selectedTrackIndex + selectedTrackIndex

        const destTrackIndex = parseInt(trackIndex, 10) + trackNumberOffset

        if (destTrackIndex < tracks.length) {
          tracks[destTrackIndex].addEvents(events)
        }
      }
    })
  }

// returns { trackIndex: [eventId] }
export const getEventsInSelection =
  (
    selection: ArrangeSelection,
  ): SongTracksCommand<{ [key: number]: number[] }> =>
  (tracks) => {
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

export const hasSelectionNotes =
  (selection: ArrangeSelection): SongTracksCommand<boolean> =>
  (tracks) => {
    const selectedEventIds = getEventsInSelection(selection)(tracks)
    return Object.values(selectedEventIds).some((ids) => ids.length > 0)
  }
