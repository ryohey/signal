import { useCallback, useMemo } from "react"
import {
  useChangeDuration,
  useCopySelection,
  useCutSelection,
  useCycleSameTickNote,
  useDeleteAndSelectPrevious,
  useDuplicateSelection,
  useExpandSelection,
  useGoToBeginning,
  useGoToEnd,
  useInputNoteByKey,
  useMoveCursor,
  useMoveSelectedNotes,
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

  // Vim-style actions
  const selectNoteByProximity = useSelectNoteByProximity()
  const cycleSameTickNote = useCycleSameTickNote()
  const inputNoteByKey = useInputNoteByKey()
  const changeDuration = useChangeDuration()
  const expandSelection = useExpandSelection()
  const deleteAndSelectPrevious = useDeleteAndSelectPrevious()
  const moveCursor = useMoveCursor()
  const goToBeginning = useGoToBeginning()
  const goToEnd = useGoToEnd()
  const moveSelectedNotes = useMoveSelectedNotes()

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

  const handleCtrlLeft = useCallback(() => {
    if (selectedNoteIds.length === 0) {
      goToBeginning()
    }
  }, [selectedNoteIds, goToBeginning])

  const actions = useMemo(
    () => [
      // ─── Note Input (letter keys) ───
      // Bare letter = place note and advance cursor
      { code: "KeyC", run: () => inputNoteByKey("C") },
      { code: "KeyD", run: () => inputNoteByKey("D") },
      { code: "KeyE", run: () => inputNoteByKey("E") },
      { code: "KeyF", run: () => inputNoteByKey("F") },
      { code: "KeyG", run: () => inputNoteByKey("G") },
      { code: "KeyA", run: () => inputNoteByKey("A") },
      { code: "KeyB", run: () => inputNoteByKey("B") },

      // Shift+letter = place note at same position (no advance)
      {
        code: "KeyC",
        shiftKey: true,
        run: () => inputNoteByKey("C", false),
      },
      {
        code: "KeyD",
        shiftKey: true,
        run: () => inputNoteByKey("D", false),
      },
      {
        code: "KeyE",
        shiftKey: true,
        run: () => inputNoteByKey("E", false),
      },
      {
        code: "KeyF",
        shiftKey: true,
        run: () => inputNoteByKey("F", false),
      },
      {
        code: "KeyG",
        shiftKey: true,
        run: () => inputNoteByKey("G", false),
      },
      {
        code: "KeyA",
        shiftKey: true,
        run: () => inputNoteByKey("A", false),
      },
      {
        code: "KeyB",
        shiftKey: true,
        run: () => inputNoteByKey("B", false),
      },

      // ─── Navigation (always active, pitch-proximity based) ───
      { code: "ArrowRight", run: () => selectNoteByProximity(1) },
      { code: "ArrowLeft", run: () => selectNoteByProximity(-1) },

      // ─── Ctrl+Left to go to beginning, Ctrl+Right to go to last note ───
      {
        code: "ArrowLeft",
        metaKey: true,
        run: handleCtrlLeft,
      },
      {
        code: "ArrowRight",
        metaKey: true,
        run: goToEnd,
      },

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

      // ─── Move selected notes (Alt+Left/Right) ───
      {
        code: "ArrowRight",
        altKey: true,
        run: () => moveSelectedNotes(1),
      },
      {
        code: "ArrowLeft",
        altKey: true,
        run: () => moveSelectedNotes(-1),
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
      handleCtrlLeft,
      goToEnd,
      cycleSameTickNote,
      transposeSelection,
      handleShiftRight,
      handleShiftLeft,
      moveSelectedNotes,
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
