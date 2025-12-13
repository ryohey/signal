import { useMemo } from "react"
import {
  useCopySelection,
  useCutSelection,
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
  const cutSelection = useCutSelection()
  const duplicateSelection = useDuplicateSelection()
  const quantizeSelectedNotes = useQuantizeSelectedNotes()
  const transposeSelection = useTransposeSelection()
  const { mouseMode, resetSelection } = usePianoRoll()
  const { setOpenTransposeDialog } = usePianoRoll()

  const actions = useMemo(
    () => [
      {
        code: "KeyC",
        metaKey: true,
        run: copySelection,
      },
      {
        code: "KeyV",
        metaKey: true,
        run: () => pasteSelection(),
      },
      {
        code: "KeyX",
        metaKey: true,
        run: cutSelection,
      },
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
      copySelection,
      pasteSelection,
      cutSelection,
    ]
  )

  return useKeyboardShortcut({
    actions,
    onCopy: copySelection,
    onPaste: pasteSelection,
    onCut: cutSelection,
  })
}
