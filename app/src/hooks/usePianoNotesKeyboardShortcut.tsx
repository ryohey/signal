import { useCallback, useMemo } from "react"
import {
  useChangeDuration,
  useCopySelection,
  useCutSelection,
  useCycleSameTickNote,
  useDeleteAndSelectPrevious,
  useDuplicateSelection,
  useExpandSelection,
  useInputNoteByKey,
  useMoveCursor,
  usePasteSelection,
  useQuantizeSelectedNotes,
  useSelectNoteByProximity,
  useTransposeSelection,
} from "../actions"
import { useKeyboardShortcut } from "./useKeyboardShortcut"
import { usePianoRoll } from "./usePianoRoll"

export const usePianoNotesKeyboardShortcut = () => {
  const copySelection = useCopySelection()
  const pasteSelection = usePasteSelection()
  const cutSelection = useCutSelection()
  const duplicateSelection = useDuplicateSelection()
  const quantizeSelectedNotes = useQuantizeSelectedNotes()
  const transposeSelection = useTransposeSelection()
  const {
    resetSelection,
    setOpenTransposeDialog,
    selectedNoteIds,
    setSelectionAnchorTick,
  } = usePianoRoll()

  // New vim-style actions
  const selectNoteByProximity = useSelectNoteByProximity()
  const cycleSameTickNote = useCycleSameTickNote()
  const inputNoteByKey = useInputNoteByKey()
  const changeDuration = useChangeDuration()
  const expandSelection = useExpandSelection()
  const deleteAndSelectPrevious = useDeleteAndSelectPrevious()
  const moveCursor = useMoveCursor()

  const handleShiftRight = useCallback(() => {
    if (selectedNoteIds.length > 0) {
      changeDuration(1)
    } else {
      expandSelection(1)
    }
  }, [selectedNoteIds, changeDuration, expandSelection])

  const handleShiftLeft = useCallback(() => {
    if (selectedNoteIds.length > 0) {
      changeDuration(-1)
    } else {
      expandSelection(-1)
    }
  }, [selectedNoteIds, changeDuration, expandSelection])

  const handleEscape = useCallback(() => {
    resetSelection()
    setSelectionAnchorTick(null)
  }, [resetSelection, setSelectionAnchorTick])

  const actions = useMemo(
    () => [
      // ─── Note Input (letter keys) ───
      { code: "KeyC", run: () => inputNoteByKey("C") },
      { code: "KeyD", run: () => inputNoteByKey("D") },
      { code: "KeyE", run: () => inputNoteByKey("E") },
      { code: "KeyF", run: () => inputNoteByKey("F") },
      { code: "KeyG", run: () => inputNoteByKey("G") },
      { code: "KeyA", run: () => inputNoteByKey("A") },
      { code: "KeyB", run: () => inputNoteByKey("B") },

      // ─── Navigation (always active, pitch-proximity based) ───
      { code: "ArrowRight", run: () => selectNoteByProximity(1) },
      { code: "ArrowLeft", run: () => selectNoteByProximity(-1) },

      // ─── Same-tick cycling (Ctrl/Cmd+Up/Down) ───
      {
        code: "ArrowUp",
        metaKey: true,
        run: () => cycleSameTickNote(1),
      },
      {
        code: "ArrowDown",
        metaKey: true,
        run: () => cycleSameTickNote(-1),
      },

      // ─── Transpose (keep existing) ───
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

      // ─── Duration / Selection expansion (Shift+Left/Right) ───
      {
        code: "ArrowRight",
        shiftKey: true,
        run: handleShiftRight,
      },
      {
        code: "ArrowLeft",
        shiftKey: true,
        run: handleShiftLeft,
      },

      // ─── Cursor movement (A/D override global rewind/forward) ───
      { code: "KeyA", run: () => moveCursor(-1) },
      { code: "KeyD", run: () => moveCursor(1) },

      // ─── Delete with auto-previous ───
      { code: "Delete", run: deleteAndSelectPrevious },
      { code: "Backspace", run: deleteAndSelectPrevious },

      // ─── Standard editing shortcuts (keep existing) ───
      { code: "KeyC", metaKey: true, run: copySelection },
      { code: "KeyV", metaKey: true, run: () => pasteSelection() },
      { code: "KeyX", metaKey: true, run: cutSelection },
      { code: "KeyD", metaKey: true, run: duplicateSelection },
      { code: "KeyQ", run: quantizeSelectedNotes },
      { code: "KeyT", run: () => setOpenTransposeDialog(true) },
      { code: "Escape", run: handleEscape },
    ],
    [
      inputNoteByKey,
      selectNoteByProximity,
      cycleSameTickNote,
      transposeSelection,
      handleShiftRight,
      handleShiftLeft,
      moveCursor,
      deleteAndSelectPrevious,
      copySelection,
      pasteSelection,
      cutSelection,
      duplicateSelection,
      quantizeSelectedNotes,
      setOpenTransposeDialog,
      handleEscape,
    ],
  )

  return useKeyboardShortcut({
    actions,
    onCopy: copySelection,
    onPaste: pasteSelection,
    onCut: cutSelection,
  })
}
