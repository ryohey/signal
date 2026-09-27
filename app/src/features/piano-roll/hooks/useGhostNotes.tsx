import {
  isEventOverlapRange,
  isNoteEvent,
  Range,
  selectorToQuery,
  TrackEventsQuery,
  TrackId,
} from "@signal-app/core"
import { NoteEvent } from "@signal-app/pianoroll-editor"
import { useCallback, useMemo } from "react"
import { useSyncTrackQuery } from "../../../hooks/useSyncTrackQuery"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { useTrack } from "../../../hooks/useTrack"
import { useNoteCoordTransform } from "./useNoteCoordTransform"

const ghostNotesQuery = (
  tickRange: Range,
): TrackEventsQuery<readonly NoteEvent[]> =>
  selectorToQuery((events) =>
    events.filter(isEventOverlapRange(tickRange)).filter(isNoteEvent),
  )

export function useGhostNotes(trackId: TrackId) {
  const { transform } = useNoteCoordTransform()
  const { tickRange } = useTickScroll()
  const { isRhythmTrack } = useTrack(trackId)
  const query = useMemo(() => ghostNotesQuery(tickRange), [tickRange])
  const noteEvents = useSyncTrackQuery(trackId, query, isNoteEvent) ?? []

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
