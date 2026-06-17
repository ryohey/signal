import {
  isEventOverlapRange,
  isNoteEvent,
  NoteEvent,
  TrackId,
} from "@signal-app/core"
import { useCallback, useMemo } from "react"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { useTrack } from "../../../hooks/useTrack"
import { useNoteCoordTransform } from "./useNoteCoordTransform"

export function useGhostNotes(trackId: TrackId) {
  const { transform } = useNoteCoordTransform()
  const { isRhythmTrack, events } = useTrack(trackId)
  const { tickRange } = useTickScroll()

  const getRect = useCallback(
    (e: NoteEvent) =>
      isRhythmTrack ? transform.getDrumRect(e) : transform.getRect(e),
    [transform, isRhythmTrack],
  )

  const notes = useMemo(
    () =>
      events
        .filter(isEventOverlapRange(tickRange))
        .filter(isNoteEvent)
        .map((e) => {
          const rect = getRect(e)
          return {
            ...rect,
            id: e.id,
            velocity: 127, // draw opaque when ghost
            noteNumber: e.noteNumber,
            isSelected: false,
          }
        }),
    [events, tickRange, getRect],
  )

  return { notes, isRhythmTrack }
}
