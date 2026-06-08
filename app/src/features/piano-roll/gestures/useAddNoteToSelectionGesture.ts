import { useCallback } from "react"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { usePianoRoll } from "../hooks/usePianoRoll"

export const useAddNoteToSelectionGesture = (): MouseDownHandler<[number]> => {
  const { selectedNoteIds, setSelectedNoteIds } = usePianoRoll()

  return useCallback(
    (_e, noteId) => {
      setSelectedNoteIds([...selectedNoteIds, noteId])
    },
    [selectedNoteIds, setSelectedNoteIds],
  )
}
