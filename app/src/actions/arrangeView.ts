import mapValues from "lodash/mapValues"
import {
  ArrangeNotesClipboardData,
  isArrangeNotesClipboardData,
} from "../clipboard/clipboardTypes"
import { Range } from "../entities/geometry/Range"
import { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import { ArrangePoint } from "../entities/transform/ArrangePoint"
import { isNotUndefined } from "../helpers/array"
import { isEventInRange } from "../helpers/filterEvents"
import clipboard from "../services/Clipboard"
import RootStore from "../stores/RootStore"
import Track from "../track"
import { batchUpdateNotesVelocity, BatchUpdateOperation } from "./track"

export const arrangeResizeSelection =
  ({
    song: { tracks },
    arrangeViewStore,
    arrangeViewStore: { quantizer },
  }: RootStore) =>
  (start: ArrangePoint, end: ArrangePoint) => {
    // 選択範囲作成時 (確定前) のドラッグ中
    // Drag during selection (before finalization)
    arrangeViewStore.selection = ArrangeSelection.fromPoints(
      start,
      end,
      quantizer,
      tracks.length,
    )
  }

export const arrangeEndSelection =
  ({
    arrangeViewStore,
    arrangeViewStore: { selection },
    song: { tracks },
  }: RootStore) =>
  () => {
    if (selection) {
      arrangeViewStore.selectedEventIds = getEventsInSelection(
        tracks,
        selection,
      )
    }
  }

export const arrangeMoveSelection =
  (rootStore: RootStore) => (point: ArrangePoint) => {
    const {
      arrangeViewStore: { quantizer, selection },
      song: { tracks },
    } = rootStore

    if (selection === null) {
      return
    }

    // quantize
    point = {
      tick: quantizer.round(point.tick),
      trackIndex: Math.round(point.trackIndex),
    }

    // clamp
    point = ArrangePoint.clamp(
      point,
      tracks.length - (selection.toTrackIndex - selection.fromTrackIndex),
    )

    const delta = ArrangePoint.sub(point, ArrangeSelection.start(selection))

    arrangeMoveSelectionBy(rootStore)(delta)
  }

export const arrangeMoveSelectionBy =
  ({ arrangeViewStore: s, song: { tracks }, pushHistory }: RootStore) =>
  (delta: ArrangePoint) => {
    if (s.selection === null) {
      return
    }

    if (delta.tick === 0 && delta.trackIndex === 0) {
      return
    }

    // 選択範囲を移動
    // Move selection range
    const selection = ArrangeSelection.moved(s.selection, delta)

    s.selection = selection

    // ノートを移動
    // Move notes

    const updates = []
    for (const [trackIndexStr, selectedEventIds] of Object.entries(
      s.selectedEventIds,
    )) {
      const trackIndex = parseInt(trackIndexStr, 10)
      const track = tracks[trackIndex]
      const events = selectedEventIds
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
      const ids: { [key: number]: number[] } = {}
      for (const u of updates) {
        tracks[u.sourceTrackIndex].removeEvents(u.events.map((e) => e.id))
        const events = tracks[u.destinationTrackIndex].addEvents(u.events)
        ids[u.destinationTrackIndex] = events.map((e) => e.id)
      }
      s.selectedEventIds = ids
    }
  }

export const arrangeCopySelection =
  ({
    arrangeViewStore: { selection, selectedEventIds },
    song: { tracks },
  }: RootStore) =>
  () => {
    if (selection === null) {
      return
    }
    // 選択されたノートをコピー
    // Copy selected note
    const notes = mapValues(selectedEventIds, (ids, trackIndex) => {
      const track = tracks[parseInt(trackIndex, 10)]
      return ids
        .map((id) => track.getEventById(id))
        .filter(isNotUndefined)
        .map((note) => ({
          ...note,
          tick: note.tick - selection.fromTick, // 選択範囲からの相対位置にする // To relative position from selection
        }))
    })
    const data: ArrangeNotesClipboardData = {
      type: "arrange_notes",
      notes,
      selectedTrackIndex: selection.fromTrackIndex,
    }
    clipboard.writeText(JSON.stringify(data))
  }

export const arrangePasteSelection =
  ({
    song: { tracks },
    player,
    arrangeViewStore: { selectedTrackIndex },
    pushHistory,
  }: RootStore) =>
  () => {
    // 現在位置にコピーしたノートをペースト
    // Paste notes copied to the current position
    const text = clipboard.readText()
    if (!text || text.length === 0) {
      return
    }
    const obj = JSON.parse(text)
    if (!isArrangeNotesClipboardData(obj)) {
      return
    }

    pushHistory()

    for (const trackIndex in obj.notes) {
      const notes = obj.notes[trackIndex].map((note) => ({
        ...note,
        tick: note.tick + player.position,
      }))

      const isRulerSelected = selectedTrackIndex < 0
      const trackNumberOffset = isRulerSelected
        ? 0
        : -obj.selectedTrackIndex + selectedTrackIndex

      const destTrackIndex = parseInt(trackIndex) + trackNumberOffset

      if (destTrackIndex < tracks.length) {
        tracks[destTrackIndex].addEvents(notes)
      }
    }
  }

export const arrangeDeleteSelection =
  ({ arrangeViewStore: s, song: { tracks }, pushHistory }: RootStore) =>
  () => {
    pushHistory()

    // 選択範囲と選択されたノートを削除
    // Remove selected notes and selected notes
    for (const trackIndex in s.selectedEventIds) {
      tracks[trackIndex].removeEvents(s.selectedEventIds[trackIndex])
    }
    s.selection = null
    s.selectedEventIds = []
  }

// returns { trackIndex: [eventId] }
function getEventsInSelection(tracks: Track[], selection: ArrangeSelection) {
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
    ids[trackIndex] = events.map((e) => e.id)
  }
  return ids
}

export const arrangeTransposeSelection =
  ({ song, pushHistory, arrangeViewStore: { selectedEventIds } }: RootStore) =>
  (deltaPitch: number) => {
    pushHistory()
    song.transposeNotes(deltaPitch, selectedEventIds)
  }

export const arrangeDuplicateSelection =
  ({
    song: { tracks },
    arrangeViewStore,
    arrangeViewStore: { selection, selectedEventIds },
    pushHistory,
  }: RootStore) =>
  () => {
    if (selection === null) {
      return
    }

    pushHistory()

    const deltaTick = selection.toTick - selection.fromTick
    const addedEventIds: { [key: number]: number[] } = {}

    for (const [trackIndexStr, eventIds] of Object.entries(selectedEventIds)) {
      const trackIndex = parseInt(trackIndexStr, 10)
      const track = tracks[trackIndex]
      const events = eventIds
        .map((id) => track.getEventById(id))
        .filter(isNotUndefined)

      const newEvent = track.addEvents(
        events.map((e) => ({
          ...e,
          tick: e.tick + deltaTick,
        })),
      )

      addedEventIds[trackIndex] = newEvent.map((e) => e.id)
    }

    arrangeViewStore.selection = {
      fromTick: selection.fromTick + deltaTick,
      fromTrackIndex: selection.fromTrackIndex,
      toTick: selection.toTick + deltaTick,
      toTrackIndex: selection.toTrackIndex,
    }

    arrangeViewStore.selectedEventIds = addedEventIds
  }

export const arrangeBatchUpdateSelectedNotesVelocity =
  ({ arrangeViewStore, song: { tracks }, pushHistory }: RootStore) =>
  (operation: BatchUpdateOperation) => {
    const { selectedEventIds } = arrangeViewStore
    pushHistory()

    for (const [trackIndexStr, eventIds] of Object.entries(selectedEventIds)) {
      const trackIndex = parseInt(trackIndexStr, 10)
      const track = tracks[trackIndex]
      batchUpdateNotesVelocity(track, eventIds, operation)
    }
  }
