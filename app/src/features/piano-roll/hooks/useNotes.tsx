import { Rect } from "@signal-app/geometry"
import { NoteEvent } from "@signal-app/pianoroll-editor"
import { useCallback, useMemo } from "react"
import { useNoteEvents } from "./useEventView"
import { useIsRhythmTrack } from "./useIsRhythmTrack"
import { useNoteCoordTransform } from "./useNoteCoordTransform"
import { usePianoRoll } from "./usePianoRoll"

export type PianoNoteItem = Rect & {
  id: number
  velocity: number
  noteNumber: number
  isSelected: boolean
}

export function useNotes(): PianoNoteItem[] {
  const { selectedNoteIds } = usePianoRoll()
  const { transform } = useNoteCoordTransform()
  const isRhythmTrack = useIsRhythmTrack()
  const noteEvents = useNoteEvents()
  const getRect = useCallback(
    (e: NoteEvent) =>
      isRhythmTrack ? transform.getDrumRect(e) : transform.getRect(e),
    [transform, isRhythmTrack],
  )

  const selectedNoteIdSet = useMemo(
    () => new Set(selectedNoteIds),
    [selectedNoteIds],
  )

  const notes = useMemo(
    () =>
      noteEvents.map((e) => {
        const bounds = getRect(e)
        const isSelected = selectedNoteIdSet.has(e.id)
        return {
          ...bounds,
          id: e.id,
          velocity: e.velocity,
          noteNumber: e.noteNumber,
          isSelected,
        }
      }),
    [noteEvents, getRect, selectedNoteIdSet],
  )

  return notes
}
