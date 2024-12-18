import {
  useCopySelection,
  useDeleteSelection,
  useDuplicateSelection,
  usePasteSelection,
  useQuantizeSelectedNotes,
  useSelectAllNotes,
  useSelectNextNote,
  useSelectPreviousNote,
  useTransposeSelection,
} from "../../actions"
import { useStores } from "../../hooks/useStores"

export const usePianoNotesKeyboardShortcutActions = () => {
  const selectNextNote = useSelectNextNote()
  const selectPreviousNote = useSelectPreviousNote()
  const copySelection = useCopySelection()
  const deleteSelection = useDeleteSelection()
  const pasteSelection = usePasteSelection()
  const duplicateSelection = useDuplicateSelection()
  const selectAllNotes = useSelectAllNotes()
  const quantizeSelectedNotes = useQuantizeSelectedNotes()
  const transposeSelection = useTransposeSelection()
  const { pianoRollStore } = useStores()

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
      code: "KeyA",
      metaKey: true,
      run: selectAllNotes,
    },
    {
      code: "KeyQ",
      run: quantizeSelectedNotes,
    },
    {
      code: "KeyT",
      run: () => (pianoRollStore.openTransposeDialog = true),
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
      enabled: () => pianoRollStore.mouseMode == "pencil",
    },
    {
      code: "ArrowLeft",
      run: selectPreviousNote,
      enabled: () => pianoRollStore.mouseMode == "pencil",
    },
    { code: "Escape", run: () => pianoRollStore.resetSelection() },
  ]
}
