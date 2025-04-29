import {
  useCopySelection,
  useDeleteSelection,
  useDuplicateSelection,
  usePasteSelection,
  useQuantizeSelectedNotes,
  useSelectNextNote,
  useSelectPreviousNote,
  useTransposeSelection,
} from "../../actions"
import { usePianoRoll } from "../../hooks/usePianoRoll"

export const usePianoNotesKeyboardShortcutActions = () => {
  const selectNextNote = useSelectNextNote()
  const selectPreviousNote = useSelectPreviousNote()
  const copySelection = useCopySelection()
  const deleteSelection = useDeleteSelection()
  const pasteSelection = usePasteSelection()
  const duplicateSelection = useDuplicateSelection()
  const quantizeSelectedNotes = useQuantizeSelectedNotes()
  const transposeSelection = useTransposeSelection()
  const { setMouseMode, resetSelection, setOpenTransposeDialog } =
    usePianoRoll()

  return () => [
    {
      code: "KeyC",
      metaKey: true,
      run: copySelection,
    },
    {
      code: "KeyX",
      metaKey: true,
      run: () => {
        copySelection()
        deleteSelection()
      },
    },
    {
      code: "KeyV",
      metaKey: true,
      run: pasteSelection,
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
      enabled: () => setMouseMode("pencil"),
    },
    {
      code: "ArrowLeft",
      run: selectPreviousNote,
      enabled: () => setMouseMode("pencil"),
    },
    { code: "Escape", run: () => resetSelection() },
  ]
}
