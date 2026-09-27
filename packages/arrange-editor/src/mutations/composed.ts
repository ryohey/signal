import {
  BatchUpdateOperation,
  batchUpdateNoteVelocity,
  isNoteEvent,
  isNotUndefined,
  NoteEvent,
  TrackEvent,
  transposeNote,
} from "@signal-app/core"
import { ArrangePoint } from "../entities/ArrangePoint"
import { ArrangeSelection } from "../entities/ArrangeSelection"
import { ArrangeEventsClipboardData } from "../entities/clipboardTypes"
import { getEventsInSelection } from "../queries/items"
import { ArrangeEditorMutator } from "./type"

// Every mutator below works on whatever events the selection covers, not
// just notes. transposeSelection/batchUpdateSelectionVelocity are the
// exception only because their transform is note-specific; they skip other
// event types rather than excluding them from the selection.

// returns moved event ids, keyed by their (possibly new) track index
export const moveEvents =
  (
    eventIdForTrackIndex: { [trackIndex: number]: number[] },
    delta: ArrangePoint,
  ): ArrangeEditorMutator<{ [trackIndex: number]: number[] }> =>
  (editor) => {
    if (delta.trackIndex === 0) {
      for (const trackIndexStr in eventIdForTrackIndex) {
        const trackIndex = parseInt(trackIndexStr, 10)
        eventIdForTrackIndex[trackIndex]
          .map((id) => editor.getEventById(trackIndex, id))
          .filter(isNotUndefined)
          .forEach((event) =>
            editor.updateEvent(trackIndex, event.id, {
              tick: event.tick + delta.tick,
            }),
          )
      }
      return eventIdForTrackIndex
    }

    const moved: { sourceTrackIndex: number; events: TrackEvent[] }[] = []
    for (const trackIndexStr in eventIdForTrackIndex) {
      const trackIndex = parseInt(trackIndexStr, 10)
      moved.push({
        sourceTrackIndex: trackIndex,
        events: eventIdForTrackIndex[trackIndex]
          .map((id) => editor.getEventById(trackIndex, id))
          .filter(isNotUndefined)
          .map((event) => ({ ...event, tick: event.tick + delta.tick })),
      })
    }

    const ids: { [trackIndex: number]: number[] } = {}
    for (const { sourceTrackIndex, events } of moved) {
      const destTrackIndex = sourceTrackIndex + delta.trackIndex
      events.forEach((event) => editor.removeEvent(sourceTrackIndex, event.id))
      ids[destTrackIndex] = events
        .map((event) => editor.addEvent(destTrackIndex, event))
        .filter(isNotUndefined)
        .map((event) => event.id)
    }
    return ids
  }

export const duplicateSelection =
  (selection: ArrangeSelection): ArrangeEditorMutator<ArrangeSelection> =>
  (editor) => {
    const deltaTick = selection.toTick - selection.fromTick
    const eventsByTrackIndex = getEventsInSelection(selection)(editor)

    for (const trackIndexStr in eventsByTrackIndex) {
      const trackIndex = parseInt(trackIndexStr, 10)
      eventsByTrackIndex[trackIndex].forEach((event) =>
        editor.addEvent(trackIndex, {
          ...event,
          tick: event.tick + deltaTick,
        }),
      )
    }

    return {
      fromTick: selection.fromTick + deltaTick,
      fromTrackIndex: selection.fromTrackIndex,
      toTick: selection.toTick + deltaTick,
      toTrackIndex: selection.toTrackIndex,
    }
  }

export const removeSelection =
  (selection: ArrangeSelection): ArrangeEditorMutator<void> =>
  (editor) => {
    const eventsByTrackIndex = getEventsInSelection(selection)(editor)
    for (const trackIndexStr in eventsByTrackIndex) {
      const trackIndex = parseInt(trackIndexStr, 10)
      eventsByTrackIndex[trackIndex].forEach((event) =>
        editor.removeEvent(trackIndex, event.id),
      )
    }
  }

export const transposeSelection =
  (
    selection: ArrangeSelection,
    deltaPitch: number,
  ): ArrangeEditorMutator<void> =>
  (editor) => {
    const eventsByTrackIndex = getEventsInSelection(selection)(editor)
    for (const trackIndexStr in eventsByTrackIndex) {
      const trackIndex = parseInt(trackIndexStr, 10)
      eventsByTrackIndex[trackIndex]
        .filter(isNoteEvent)
        .forEach((note: NoteEvent) =>
          editor.updateEvent(trackIndex, note.id, {
            noteNumber: transposeNote(deltaPitch)(note).noteNumber,
          }),
        )
    }
  }

export const batchUpdateSelectionVelocity =
  (
    selection: ArrangeSelection,
    operation: BatchUpdateOperation,
  ): ArrangeEditorMutator<void> =>
  (editor) => {
    const eventsByTrackIndex = getEventsInSelection(selection)(editor)
    for (const trackIndexStr in eventsByTrackIndex) {
      const trackIndex = parseInt(trackIndexStr, 10)
      eventsByTrackIndex[trackIndex]
        .filter(isNoteEvent)
        .forEach((note: NoteEvent) =>
          editor.updateEvent(trackIndex, note.id, {
            velocity: batchUpdateNoteVelocity(operation)(note).velocity,
          }),
        )
    }
  }

export const pasteEventsAt =
  (
    data: ArrangeEventsClipboardData,
    position: number,
    selectedTrackIndex: number,
  ): ArrangeEditorMutator<void> =>
  (editor) => {
    const trackCount = editor.trackCount
    const isRulerSelected = selectedTrackIndex < 0
    const trackNumberOffset = isRulerSelected
      ? 0
      : -data.selectedTrackIndex + selectedTrackIndex

    for (const trackIndexStr in data.events) {
      const destTrackIndex = parseInt(trackIndexStr, 10) + trackNumberOffset
      if (destTrackIndex >= trackCount) {
        continue
      }
      const events = data.events[trackIndexStr] as readonly TrackEvent[]
      events.forEach((event) =>
        editor.addEvent(destTrackIndex, {
          ...event,
          tick: event.tick + position,
        }),
      )
    }
  }
