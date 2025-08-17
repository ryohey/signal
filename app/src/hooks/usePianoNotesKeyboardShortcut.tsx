import { useCallback, useMemo } from "react"
import {
  useCopySelection,
  useDeleteSelection,
  useDuplicateSelection,
  usePasteSelection,
  useQuantizeSelectedNotes,
  useSelectNextNote,
  useSelectPreviousNote,
  useTransposeSelection,
} from "../actions"
import { useKeyboardShortcut } from "./useKeyboardShortcut"
import { usePianoRoll } from "./usePianoRoll"

export const usePianoNotesKeyboardShortcut = () => {
  const selectNextNote = useSelectNextNote()
  const selectPreviousNote = useSelectPreviousNote()
  const copySelection = useCopySelection()
  const deleteSelection = useDeleteSelection()
  const pasteSelection = usePasteSelection()
  const duplicateSelection = useDuplicateSelection()
  const quantizeSelectedNotes = useQuantizeSelectedNotes()
  const transposeSelection = useTransposeSelection()
  const { mouseMode, resetSelection } = usePianoRoll()
  const { setOpenTransposeDialog } = usePianoRoll()

  const onCut = useCallback(() => {
    copySelection()
    deleteSelection()
  }, [copySelection, deleteSelection])

  const actions = useMemo(
    () => [
      {
        code: "KeyD",
        metaKey: true,
        run: duplicateSelection,
      },
      {
        code: "KeyQ",
        run: quantizeSelectedNotes,
      },
      {
        code: "KeyT",
        run: () => setOpenTransposeDialog(true),
      },
      { code: "Delete", run: deleteSelection },
      {
        code: "Backspace",
        run: deleteSelection,
      },
      {
        code: "ArrowUp",
        shiftKey: true,
        run: () => transposeSelection(12),
      },
      {
        code: "ArrowUp",
        run: () => transposeSelection(1),
      },
      {
        code: "ArrowDown",
        shiftKey: true,
        run: () => transposeSelection(-12),
      },
      {
        code: "ArrowDown",
        run: () => transposeSelection(-1),
      },
      {
        code: "ArrowRight",
        run: selectNextNote,
        enabled: () => mouseMode === "pencil",
      },
      {
        code: "ArrowLeft",
        run: selectPreviousNote,
        enabled: () => mouseMode === "pencil",
      },
      { code: "Escape", run: resetSelection },
    ],
    [
      mouseMode,
      setOpenTransposeDialog,
      deleteSelection,
      duplicateSelection,
      quantizeSelectedNotes,
      transposeSelection,
      selectNextNote,
      selectPreviousNote,
      resetSelection,
    ],
  )

  return useKeyboardShortcut({
    actions,
    onCopy: copySelection,
    onPaste: pasteSelection,
    onCut,
  })
}
