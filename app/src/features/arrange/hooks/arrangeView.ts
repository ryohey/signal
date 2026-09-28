import { ArrangeEventsClipboardDataSchema } from "@signal-app/arrange-editor"
import type { BatchUpdateOperation } from "@signal-app/core"
import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import {
  readClipboardData,
  readJSONFromClipboard,
  writeClipboardData,
} from "../../../services/Clipboard"
import { useArrangeEditor } from "./useArrangeEditor"
import { useArrangeView } from "./useArrangeView"

export const useArrangeCopySelection = () => {
  const { selection } = useArrangeView()
  const arrangeEditor = useArrangeEditor()

  return useCallback(() => {
    if (selection === null) {
      return
    }
    writeClipboardData(arrangeEditor.getEventsClipboardData(selection))
  }, [arrangeEditor, selection])
}

export const useArrangePasteSelection = () => {
  const { position } = usePlayer()
  const { pushHistory } = useHistory()
  const { selectedTrackIndex } = useArrangeView()
  const arrangeEditor = useArrangeEditor()

  return useCallback(
    async (e?: ClipboardEvent) => {
      const obj = e ? readJSONFromClipboard(e) : await readClipboardData()
      const { data, error } = ArrangeEventsClipboardDataSchema.safeParse(obj)
      if (!data) {
        console.error("Invalid clipboard data", error)
        return
      }
      pushHistory()
      arrangeEditor.pasteEventsAt(data, position, selectedTrackIndex)
    },
    [arrangeEditor, position, pushHistory, selectedTrackIndex],
  )
}

export const useArrangeDeleteSelection = () => {
  const { pushHistory } = useHistory()
  const { setSelection, selection } = useArrangeView()
  const arrangeEditor = useArrangeEditor()

  return useCallback(() => {
    if (selection === null) {
      return
    }
    pushHistory()
    arrangeEditor.removeSelection(selection)
    setSelection(null)
  }, [arrangeEditor, pushHistory, selection, setSelection])
}

export const useArrangeCutSelection = () => {
  const arrangeCopySelection = useArrangeCopySelection()
  const arrangeDeleteSelection = useArrangeDeleteSelection()

  return useCallback(() => {
    arrangeCopySelection()
    arrangeDeleteSelection()
  }, [arrangeCopySelection, arrangeDeleteSelection])
}

export const useArrangeTransposeSelection = () => {
  const { pushHistory } = useHistory()
  const { selection } = useArrangeView()
  const arrangeEditor = useArrangeEditor()

  return useCallback(
    (deltaPitch: number) => {
      if (selection === null) {
        return
      }
      pushHistory()
      arrangeEditor.transposeSelection(selection, deltaPitch)
    },
    [arrangeEditor, pushHistory, selection],
  )
}

export const useArrangeDuplicateSelection = () => {
  const { pushHistory } = useHistory()
  const { selection, setSelection } = useArrangeView()
  const arrangeEditor = useArrangeEditor()

  return useCallback(() => {
    if (selection === null) {
      return
    }
    pushHistory()
    setSelection(arrangeEditor.duplicateSelection(selection) ?? null)
  }, [arrangeEditor, selection, pushHistory, setSelection])
}

export const useArrangeBatchUpdateSelectedNotesVelocity = () => {
  const { pushHistory } = useHistory()
  const { selection } = useArrangeView()
  const arrangeEditor = useArrangeEditor()

  return useCallback(
    (operation: BatchUpdateOperation) => {
      if (selection === null) {
        return
      }
      pushHistory()
      arrangeEditor.batchUpdateSelectionVelocity(selection, operation)
    },
    [arrangeEditor, pushHistory, selection],
  )
}
