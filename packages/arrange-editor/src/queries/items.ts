import { isEventInRange, Range, type TrackEvent } from "@signal-app/core"
import type { ArrangeNote } from "../entities/ArrangeNote"
import type { ArrangeSelection } from "../entities/ArrangeSelection"
import type { ArrangeEventsClipboardData } from "../entities/clipboardTypes"
import type { ArrangeEditorQuery } from "./type"

// Only notes are drawn in the arrange view, so this is the display-side
// query. Selection and mutation deliberately work on every event type.
export const listNotes: ArrangeEditorQuery<readonly ArrangeNote[]> = (editor) =>
  editor.getArrangeNotes()

// returns { trackIndex: [eventId] } for every event in the selected tick
// range, whatever its type — a controller point inside the range travels
// with the selection just like a note does.
export const getEventIdsInSelection =
  (
    selection: ArrangeSelection,
  ): ArrangeEditorQuery<{ [trackIndex: number]: number[] }> =>
  (editor) => {
    const tickRange = Range.create(selection.fromTick, selection.toTick)
    const ids: { [trackIndex: number]: number[] } = {}
    for (
      let trackIndex = selection.fromTrackIndex;
      trackIndex < selection.toTrackIndex;
      trackIndex++
    ) {
      ids[trackIndex] = editor
        .getEvents(trackIndex)
        .filter(isEventInRange(tickRange))
        .map((e) => e.id)
    }
    return ids
  }

export const getEventsInSelection =
  (
    selection: ArrangeSelection,
  ): ArrangeEditorQuery<{ [trackIndex: number]: TrackEvent[] }> =>
  (editor) => {
    const idsByTrackIndex = getEventIdsInSelection(selection)(editor)
    const events: { [trackIndex: number]: TrackEvent[] } = {}
    for (const trackIndexStr in idsByTrackIndex) {
      const trackIndex = parseInt(trackIndexStr, 10)
      events[trackIndex] = idsByTrackIndex[trackIndex]
        .map((id) => editor.getEventById(trackIndex, id))
        .filter((e): e is TrackEvent => e !== undefined)
    }
    return events
  }

export const hasEventsInSelection =
  (selection: ArrangeSelection): ArrangeEditorQuery<boolean> =>
  (editor) =>
    Object.values(getEventIdsInSelection(selection)(editor)).some(
      (ids) => ids.length > 0,
    )

export const getEventsClipboardData =
  (
    selection: ArrangeSelection,
  ): ArrangeEditorQuery<ArrangeEventsClipboardData> =>
  (editor) => {
    const eventsByTrackIndex = getEventsInSelection(selection)(editor)
    const events: { [trackIndex: number]: TrackEvent[] } = {}
    for (const trackIndexStr in eventsByTrackIndex) {
      const trackIndex = parseInt(trackIndexStr, 10)
      events[trackIndex] = eventsByTrackIndex[trackIndex].map((e) => ({
        ...e,
        tick: e.tick - selection.fromTick,
      }))
    }
    return {
      type: "arrange_events",
      events,
      selectedTrackIndex: selection.fromTrackIndex,
    }
  }
