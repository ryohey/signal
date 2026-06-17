import { useCallback, useEffect } from "react"
import { isRunningInElectron } from "../../../helpers/platform"
import { useGlobalClipboardEvents } from "../../../hooks/useGlobalClipboardEvents"
import { useRouter } from "../../../hooks/useRouter"
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
} from "./selection"
import { usePianoRoll } from "./usePianoRoll"

export function usePianoRollGlobalKeyboardShortcuts() {
  const { selectedNoteIds } = usePianoRoll()
  const { path } = useRouter()
  const copySelection = useCopySelection()
  const deleteSelection = useDeleteSelection()
  const pasteSelection = usePasteSelection()

  const onCut = useCallback(() => {
    if (path !== "/track") {
      return
    }
    if (selectedNoteIds.length > 0) {
      copySelection()
      deleteSelection()
    }
  }, [path, selectedNoteIds, copySelection, deleteSelection])

  const onCopy = useCallback(() => {
    if (path !== "/track") {
      return
    }
    if (selectedNoteIds.length > 0) {
      copySelection()
    }
  }, [path, selectedNoteIds, copySelection])

  const onPaste = useCallback(() => {
    if (path !== "/track") {
      return
    }
    pasteSelection()
  }, [path, pasteSelection])

  useGlobalClipboardEvents({
    onCut,
    onCopy,
    onPaste,
  })

  useElectronShortcuts()
}

function useElectronShortcuts() {
  const deleteSelection = useDeleteSelection()
  const duplicateSelection = useDuplicateSelection()
  const selectAllNotes = useSelectAllNotes()
  const selectNextNote = useSelectNextNote()
  const selectPreviousNote = useSelectPreviousNote()
  const quantizeSelectedNotes = useQuantizeSelectedNotes()
  const transposeSelection = useTransposeSelection()
  const { setOpenTransposeDialog, setOpenVelocityDialog } = usePianoRoll()

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onDuplicate(duplicateSelection)
    }
  }, [duplicateSelection])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onDelete(deleteSelection)
    }
  }, [deleteSelection])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onSelectAll(selectAllNotes)
    }
  }, [selectAllNotes])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onSelectNextNote(selectNextNote)
    }
  }, [selectNextNote])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onSelectPreviousNote(selectPreviousNote)
    }
  }, [selectPreviousNote])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onQuantize(quantizeSelectedNotes)
    }
  }, [quantizeSelectedNotes])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onTransposeUpOctave(() =>
        transposeSelection(12),
      )
    }
  }, [transposeSelection])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onTransposeDownOctave(() =>
        transposeSelection(-12),
      )
    }
  }, [transposeSelection])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onTranspose(() => setOpenTransposeDialog(true))
    }
  }, [setOpenTransposeDialog])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onVelocity(() => setOpenVelocityDialog(true))
    }
  }, [setOpenVelocityDialog])
}
