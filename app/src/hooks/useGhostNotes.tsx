import { useCallback, useMemo } from "react"
import { Range } from "../entities/geometry/Range"
import { isEventOverlapRange } from "../helpers/filterEvents"
import { isNoteEvent, NoteEvent, TrackId } from "../track"
import { useMobxSelector } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"
import { useSong } from "./useSong"

export function useGhostNotes(trackId: TrackId) {
  const { transform, scrollLeft, canvasWidth } = usePianoRoll()
  const song = useSong()
  const track = useMobxSelector(() => song.getTrack(trackId), [song, trackId])
  const events = useMobxSelector(() => track?.events ?? [], [track])
  const isRhythmTrack = useMobxSelector(
    () => track?.isRhythmTrack ?? false,
    [track],
  )

  const noteEvents = useMemo(() => events.filter(isNoteEvent), [events])

  const windowedEvents = useMemo(
    () =>
      noteEvents.filter(
        isEventOverlapRange(
          Range.fromLength(
            transform.getTick(scrollLeft),
            transform.getTick(canvasWidth),
          ),
        ),
      ),
    [scrollLeft, canvasWidth, transform.horizontalId, noteEvents],
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
          isSelected: false,
        }
      }),
    [windowedEvents, getRect],
  )

  return { notes, isRhythmTrack }
}
