import { useCallback, useMemo } from "react"
import { Rect } from "../entities/geometry/Rect"
import { isNoteEvent, NoteEvent } from "../track"
import { useEventView } from "./useEventView"
import { usePianoRoll } from "./usePianoRoll"

export type PianoNoteItem = Rect & {
  id: number
  velocity: number
  noteNumber: number
  isSelected: boolean
}

export function useNotes(): PianoNoteItem[] {
  const { transform, selectedTrack, selectedNoteIds } = usePianoRoll()
  const noteEvents = useEventView().filter(isNoteEvent)

  const getRect = useCallback(
    (e: NoteEvent) =>
      selectedTrack?.isRhythmTrack
        ? transform.getDrumRect(e)
        : transform.getRect(e),
    [transform, selectedTrack?.isRhythmTrack],
  )

  const notes = useMemo(
    () =>
      noteEvents.map((e) => {
        const bounds = getRect(e)
        const isSelected = selectedNoteIds.includes(e.id)
        return {
          ...bounds,
          id: e.id,
          velocity: e.velocity,
          noteNumber: e.noteNumber,
          isSelected,
        }
      }),
    [noteEvents, getRect, selectedNoteIds],
  )

  return notes
}
