import { useCallback, useMemo } from "react"
import { isNoteEvent, NoteEvent, TrackId } from "../track"
import {
  useEventView,
  useEventViewForTrack,
  useSyncEventViewWithScroll,
} from "./useEventView"
import { usePianoRoll } from "./usePianoRoll"
import { useTrack } from "./useTrack"

export function useGhostNotes(trackId: TrackId) {
  const { transform } = usePianoRoll()
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
