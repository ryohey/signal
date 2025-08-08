import { useCallback, useMemo } from "react"
import { Range } from "../entities/geometry/Range"
import { isEventOverlapRange } from "../helpers/filterEvents"
import { isNoteEvent, NoteEvent, TrackId } from "../track"
import { usePianoRoll } from "./usePianoRoll"
import { useTickScroll } from "./useTickScroll"
import { useTrack } from "./useTrack"

export function useGhostNotes(trackId: TrackId) {
  const { transform } = usePianoRoll()
  const { canvasWidth, scrollLeft, transform: tickTransform } = useTickScroll()
  const { events, isRhythmTrack } = useTrack(trackId)

  const noteEvents = useMemo(() => events.filter(isNoteEvent), [events])

  const windowedEvents = useMemo(
    () =>
      noteEvents.filter(
        isEventOverlapRange(
          Range.fromLength(
            tickTransform.getTick(scrollLeft),
            tickTransform.getTick(canvasWidth),
          ),
        ),
      ),
    [scrollLeft, canvasWidth, tickTransform, noteEvents],
  )

  const getRect = useCallback(
    (e: NoteEvent) =>
      isRhythmTrack ? transform.getDrumRect(e) : transform.getRect(e),
    [transform, isRhythmTrack],
  )

  const notes = useMemo(
    () =>
      windowedEvents.map((e) => {
        const rect = getRect(e)
        return {
          ...rect,
          id: e.id,
          velocity: 127, // draw opaque when ghost
          noteNumber: e.noteNumber,
          isSelected: false,
        }
      }),
    [windowedEvents, getRect],
  )

  return { notes, isRhythmTrack }
}
