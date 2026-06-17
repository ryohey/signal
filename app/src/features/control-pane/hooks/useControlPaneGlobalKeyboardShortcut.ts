import { useCallback } from "react"
import { useGlobalClipboardEvents } from "../../../hooks/useGlobalClipboardEvents"
import { useRouter } from "../../../hooks/useRouter"
import {
  useCopyControlSelection,
  useDeleteControlSelection,
  usePasteControlSelection,
} from "./control"
import { useControlPane } from "./useControlPane"

export function useControlPaneGlobalKeyboardShortcut() {
  const { path } = useRouter()
  const { selectedEventIds: controlSelectedEventIds } = useControlPane()
  const copyControlSelection = useCopyControlSelection()
  const deleteControlSelection = useDeleteControlSelection()
  const pasteControlSelection = usePasteControlSelection()

  const onCopy = useCallback(() => {
    if (path !== "/track") {
      return
    }
    if (controlSelectedEventIds.length > 0) {
      copyControlSelection()
    }
  }, [path, controlSelectedEventIds, copyControlSelection])

  const onCut = useCallback(() => {
    if (path !== "/track") {
      return
    }
    if (controlSelectedEventIds.length > 0) {
      copyControlSelection()
      deleteControlSelection()
    }
  }, [
    path,
    controlSelectedEventIds,
    copyControlSelection,
    deleteControlSelection,
  ])

  const onPaste = useCallback(() => {
    if (path !== "/track") {
      return
    }
    pasteControlSelection()
  }, [path, pasteControlSelection])

  useGlobalClipboardEvents({
    onCopy,
    onCut,
    onPaste,
  })
}
