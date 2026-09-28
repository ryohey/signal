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
import { usePianoRollVelocityDialog } from "./usePianoRollVelocityDialog"

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
  const { setOpenTransposeDialog } = usePianoRoll()
  const { setOpen: setOpenVelocityDialog } = usePianoRollVelocityDialog()

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onDuplicate(duplicateSelection)
    }
    return undefined
  }, [duplicateSelection])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onDelete(deleteSelection)
    }
    return undefined
  }, [deleteSelection])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onSelectAll(selectAllNotes)
    }
    return undefined
  }, [selectAllNotes])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onSelectNextNote(selectNextNote)
    }
    return undefined
  }, [selectNextNote])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onSelectPreviousNote(selectPreviousNote)
    }
    return undefined
  }, [selectPreviousNote])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onQuantize(quantizeSelectedNotes)
    }
    return undefined
  }, [quantizeSelectedNotes])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onTransposeUpOctave(() =>
        transposeSelection(12),
      )
    }
    return undefined
  }, [transposeSelection])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onTransposeDownOctave(() =>
        transposeSelection(-12),
      )
    }
    return undefined
  }, [transposeSelection])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onTranspose(() => setOpenTransposeDialog(true))
    }
    return undefined
  }, [setOpenTransposeDialog])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onVelocity(() => setOpenVelocityDialog(true))
    }
    return undefined
  }, [setOpenVelocityDialog])
}
