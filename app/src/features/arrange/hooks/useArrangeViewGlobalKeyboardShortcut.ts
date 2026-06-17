import { useCallback } from "react"
import { useGlobalClipboardEvents } from "../../../hooks/useGlobalClipboardEvents"
import { useRouter } from "../../../hooks/useRouter"
import {
  useArrangeCopySelection,
  useArrangeDeleteSelection,
  useArrangePasteSelection,
} from "./arrangeView"

export function useArrangeViewGlobalKeyboardShortcut() {
  const { path } = useRouter()
  const arrangeCopySelection = useArrangeCopySelection()
  const arrangeDeleteSelection = useArrangeDeleteSelection()
  const arrangePasteSelection = useArrangePasteSelection()

  const onCut = useCallback(() => {
    if (path !== "/arrange") {
      return
    }
    arrangeCopySelection()
    arrangeDeleteSelection()
  }, [path, arrangeCopySelection, arrangeDeleteSelection])

  const onCopy = useCallback(() => {
    if (path !== "/arrange") {
      return
    }
    arrangeCopySelection()
  }, [path, arrangeCopySelection])

  const onPaste = useCallback(() => {
    if (path !== "/arrange") {
      return
    }
    arrangePasteSelection()
  }, [path, arrangePasteSelection])

  useGlobalClipboardEvents({
    onCut,
    onCopy,
    onPaste,
  })
}
