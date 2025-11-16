import mapValues from "lodash/mapValues"
import { useCallback } from "react"
import {
  ArrangeNotesClipboardData,
  ArrangeNotesClipboardDataSchema,
} from "../clipboard/clipboardTypes"
import { Range } from "../entities/geometry/Range"
import { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import { isNotUndefined } from "../helpers/array"
import { isEventInRange } from "../helpers/filterEvents"
import { useArrangeView } from "../hooks/useArrangeView"
import { useHistory } from "../hooks/useHistory"
import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"
import {
  readClipboardData,
  readJSONFromClipboard,
  writeClipboardData,
} from "../services/Clipboard"
import Track from "../track"
import { batchUpdateNotesVelocity, BatchUpdateOperation } from "./track"

export const useArrangeCopySelection = () => {
  const { tracks } = useSong()
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
    writeClipboardData(data)
  }
}

export const useArrangePasteSelection = () => {
  const { position } = usePlayer()
  const { tracks } = useSong()
  const { pushHistory } = useHistory()
  const { selectedTrackIndex } = useArrangeView()

  return async (e?: ClipboardEvent) => {
    const obj = e ? readJSONFromClipboard(e) : await readClipboardData()
    const { data, error } = ArrangeNotesClipboardDataSchema.safeParse(obj)

    if (!data) {
      console.error("Invalid clipboard data", error)
      return
    }

    pushHistory()

    for (const trackIndex in data.notes) {
      const notes = data.notes[trackIndex].map((note) => ({
        ...note,
        tick: note.tick + position,
      }))

      const isRulerSelected = selectedTrackIndex < 0
      const trackNumberOffset = isRulerSelected
        ? 0
        : -data.selectedTrackIndex + selectedTrackIndex

      const destTrackIndex = parseInt(trackIndex) + trackNumberOffset

      if (destTrackIndex < tracks.length) {
        tracks[destTrackIndex].addEvents(notes)
      }
    }
  }
}

export const useArrangeDeleteSelection = () => {
  const { tracks } = useSong()
  const { pushHistory } = useHistory()
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

export const useArrangeCutSelection = () => {
  const arrangeCopySelection = useArrangeCopySelection()
  const arrangeDeleteSelection = useArrangeDeleteSelection()

  return useCallback(() => {
    arrangeCopySelection()
    arrangeDeleteSelection()
  }, [arrangeCopySelection, arrangeDeleteSelection])
}

// returns { trackIndex: [eventId] }
export function getEventsInSelection(
  tracks: readonly Track[],
  selection: ArrangeSelection,
) {
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
  const { transposeNotes } = useSong()
  const { pushHistory } = useHistory()
  const { selectedEventIds } = useArrangeView()

  return (deltaPitch: number) => {
    pushHistory()
    transposeNotes(deltaPitch, selectedEventIds)
  }
}

export const useArrangeDuplicateSelection = () => {
  const { tracks } = useSong()
  const { pushHistory } = useHistory()
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
  const { tracks } = useSong()
  const { pushHistory } = useHistory()
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
