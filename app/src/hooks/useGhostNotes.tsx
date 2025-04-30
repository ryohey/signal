import { useMemo } from "react"
import { Range } from "../entities/geometry/Range"
import { isEventOverlapRange } from "../helpers/filterEvents"
import { isNoteEvent, TrackId } from "../track"
import { useMobxSelector, useMobxStore } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"

export function useGhostNotes(trackId: TrackId) {
  const { transform, scrollLeft, canvasWidth } = usePianoRoll()
  const track = useMobxStore(({ song }) => song.getTrack(trackId))
  const events = useMobxSelector(() => track?.events ?? [], [track])
  const isRhythmTrack = useMobxSelector(
    () => track?.isRhythmTrack ?? false,
    [track],
  )

  const windowedEvents = useMemo(
    () =>
      events
        .filter(isNoteEvent)
        .filter(
          isEventOverlapRange(
            Range.fromLength(
              transform.getTick(scrollLeft),
              transform.getTick(canvasWidth),
            ),
          ),
        ),
    [scrollLeft, canvasWidth, transform.horizontalId, events],
  )

  const notes = useMemo(
    () =>
      windowedEvents.map((e) => {
        const rect = isRhythmTrack
          ? transform.getDrumRect(e)
          : transform.getRect(e)
        return {
          ...rect,
          id: e.id,
          velocity: 127, // draw opaque when ghost
          isSelected: false,
        }
      }),
    [windowedEvents, transform, isRhythmTrack],
  )

  return { notes, isRhythmTrack }
}
