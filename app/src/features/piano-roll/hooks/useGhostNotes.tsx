import { isNoteEvent, NoteEvent, TrackId } from "@signal-app/core"
import { useCallback, useMemo } from "react"
import {
  useEventView,
  useEventViewForTrack,
  useSyncEventViewWithScroll,
} from "../../../hooks/useEventView"
import { useTrack } from "../../../hooks/useTrack"
import { useNoteCoordTransform } from "./useNoteCoordTransform"

export function useGhostNotes(trackId: TrackId) {
  const { transform } = useNoteCoordTransform()
  const { isRhythmTrack } = useTrack(trackId)
  const eventView = useEventViewForTrack(trackId)
  const windowedEvents = useEventView(eventView)

  useSyncEventViewWithScroll(eventView)

  const noteEvents = useMemo(
    () => windowedEvents.filter(isNoteEvent),
    [windowedEvents],
  )

  const getRect = useCallback(
    (e: NoteEvent) =>
      isRhythmTrack ? transform.getDrumRect(e) : transform.getRect(e),
    [transform, isRhythmTrack],
  )

  const notes = useMemo(
    () =>
      noteEvents.map((e) => {
        const rect = getRect(e)
        return {
          ...rect,
          id: e.id,
          velocity: 127, // draw opaque when ghost
          noteNumber: e.noteNumber,
          isSelected: false,
        }
      }),
    [noteEvents, getRect],
  )

  return { notes, isRhythmTrack }
}
