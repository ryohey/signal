import { useCallback } from "react"
import { useGlobalClipboardEvents } from "../../../hooks/useGlobalClipboardEvents"
import { useRouter } from "../../../hooks/useRouter"
import {
  useCopyTempoSelection,
  useDeleteTempoSelection,
  usePasteTempoSelection,
} from "./tempo"

export function useTempoEditorGlobalKeyboardShortcut() {
  const { path } = useRouter()
  const copyTempoSelection = useCopyTempoSelection()
  const deleteTempoSelection = useDeleteTempoSelection()
  const pasteTempoSelection = usePasteTempoSelection()

  const onCut = useCallback(() => {
    if (path !== "/tempo") {
      return
    }
    copyTempoSelection()
    deleteTempoSelection()
  }, [path, copyTempoSelection, deleteTempoSelection])

  const onCopy = useCallback(() => {
    if (path !== "/tempo") {
      return
    }
    copyTempoSelection()
  }, [path, copyTempoSelection])

  const onPaste = useCallback(() => {
    if (path !== "/tempo") {
      return
    }
    pasteTempoSelection()
  }, [path, pasteTempoSelection])

  useGlobalClipboardEvents({
    onCut,
    onCopy,
    onPaste,
  })
}
