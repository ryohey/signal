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
import { useArrangeView } from "../hooks/useArrangeView"
import { useStores } from "../hooks/useStores"
import clipboard from "../services/Clipboard"
import Track from "../track"
import { batchUpdateNotesVelocity, BatchUpdateOperation } from "./track"

export const useArrangeResizeSelection = () => {
  const rootStore = useStores()
  const { quantizer, setSelection } = useArrangeView()

  return (start: ArrangePoint, end: ArrangePoint) => {
    const {
      song: { tracks },
    } = rootStore
    // 選択範囲作成時 (確定前) のドラッグ中
    // Drag during selection (before finalization)
    setSelection(
      ArrangeSelection.fromPoints(start, end, quantizer, tracks.length),
    )
  }
}

export const useArrangeEndSelection = () => {
  const rootStore = useStores()
  const { setSelectedEventIds } = useArrangeView()

  return () => {
    const {
      song: { tracks },
      arrangeViewStore: { selection }, // read selection from store to use latest value
    } = rootStore
    if (selection) {
      setSelectedEventIds(getEventsInSelection(tracks, selection))
    }
  }
}

export const useArrangeMoveSelection = () => {
  const rootStore = useStores()
  const { quantizer } = useArrangeView()
  const arrangeMoveSelectionBy = useArrangeMoveSelectionBy()

  return (point: ArrangePoint) => {
    const {
      song: { tracks },
      arrangeViewStore: { selection }, // read selection from store to use latest value
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

    arrangeMoveSelectionBy(delta)
  }
}

export const useArrangeMoveSelectionBy = () => {
  const rootStore = useStores()
  const { setSelection, setSelectedEventIds } = useArrangeView()

  return (delta: ArrangePoint) => {
    const {
      song: { tracks },
      arrangeViewStore: { selection, selectedEventIds }, // read selection from store to use latest value
    } = rootStore

    if (selection === null) {
      return
    }

    if (delta.tick === 0 && delta.trackIndex === 0) {
      return
    }

    // Move selection range
    const newSelection = ArrangeSelection.moved(selection, delta)

    setSelection(newSelection)

    // Move notes
    const updates = []
    for (const [trackIndexStr, selectedEventIdsValue] of Object.entries(
      selectedEventIds,
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
      const ids: { [key: number]: number[] } = {}
      for (const u of updates) {
        tracks[u.sourceTrackIndex].removeEvents(u.events.map((e) => e.id))
        const events = tracks[u.destinationTrackIndex].addEvents(u.events)
        ids[u.destinationTrackIndex] = events.map((e) => e.id)
      }
      setSelectedEventIds(ids)
    }
  }
}

export const useArrangeCopySelection = () => {
  const {
    song: { tracks },
  } = useStores()
  const { selection, selectedEventIds } = useArrangeView()

  return () => {
    if (selection === null) {
      return
    }

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
    const data: ArrangeNotesClipboardData = {
      type: "arrange_notes",
      notes,
      selectedTrackIndex: selection.fromTrackIndex,
    }
    clipboard.writeText(JSON.stringify(data))
  }
}

export const useArrangePasteSelection = () => {
  const {
    song: { tracks },
    player,
    pushHistory,
  } = useStores()
  const { selectedTrackIndex } = useArrangeView()

  return () => {
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
}

export const useArrangeDeleteSelection = () => {
  const {
    song: { tracks },
    pushHistory,
  } = useStores()
  const { setSelection, selectedEventIds, setSelectedEventIds } =
    useArrangeView()

  return () => {
    pushHistory()

    for (const trackIndex in selectedEventIds) {
      tracks[trackIndex].removeEvents(selectedEventIds[trackIndex])
    }
    setSelectedEventIds({})
    setSelection(null)
  }
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

export const useArrangeTransposeSelection = () => {
  const { song, pushHistory } = useStores()
  const { selectedEventIds } = useArrangeView()

  return (deltaPitch: number) => {
    pushHistory()
    song.transposeNotes(deltaPitch, selectedEventIds)
  }
}

export const useArrangeDuplicateSelection = () => {
  const {
    song: { tracks },
    pushHistory,
  } = useStores()
  const { selection, selectedEventIds, setSelection, setSelectedEventIds } =
    useArrangeView()

  return () => {
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

    setSelection({
      fromTick: selection.fromTick + deltaTick,
      fromTrackIndex: selection.fromTrackIndex,
      toTick: selection.toTick + deltaTick,
      toTrackIndex: selection.toTrackIndex,
    })

    setSelectedEventIds(addedEventIds)
  }
}

export const useArrangeBatchUpdateSelectedNotesVelocity = () => {
  const {
    song: { tracks },
    pushHistory,
  } = useStores()
  const { selectedEventIds } = useArrangeView()

  return (operation: BatchUpdateOperation) => {
    pushHistory()

    for (const [trackIndexStr, eventIds] of Object.entries(selectedEventIds)) {
      const trackIndex = parseInt(trackIndexStr, 10)
      const track = tracks[trackIndex]
      batchUpdateNotesVelocity(track, eventIds, operation)
    }
  }
}
