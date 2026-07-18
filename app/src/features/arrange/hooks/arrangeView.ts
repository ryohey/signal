import {
  ArrangeEventsClipboardDataSchema,
  BatchUpdateOperation,
  batchUpdateArrangeNotesVelocity as batchUpdateArrangeNotesVelocityCmd,
  deleteSelection as deleteSelectionCmd,
  duplicateSelection as duplicateSelectionCmd,
  getArrangeClipboardDataForSelection as getArrangeClipboardDataForSelectionCmd,
  pasteClipboardDataAt as pasteClipboardDataAtCmd,
  transposeSelection as transposeSelectionCmd,
} from "@signal-app/core"
import { useCallback } from "react"
import { useTracksCommand } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import {
  readClipboardData,
  readJSONFromClipboard,
  writeClipboardData,
} from "../../../services/Clipboard"
import { useArrangeView } from "./useArrangeView"

export const useArrangeCopySelection = () => {
  const { selection } = useArrangeView()
  const getClipboardData = useTracksCommand(
    getArrangeClipboardDataForSelectionCmd,
  )

  return useCallback(() => {
    if (selection === null) {
      return
    }
    const data = getClipboardData(selection)
    writeClipboardData(data)
  }, [getClipboardData, selection])
}

export const useArrangePasteSelection = () => {
  const { position } = usePlayer()
  const { pushHistory } = useHistory()
  const { selectedTrackIndex } = useArrangeView()
  const pasteClipboard = useTracksCommand(pasteClipboardDataAtCmd)

  return useCallback(
    async (e?: ClipboardEvent) => {
      const obj = e ? readJSONFromClipboard(e) : await readClipboardData()
      const { data, error } = ArrangeEventsClipboardDataSchema.safeParse(obj)
      if (!data) {
        console.error("Invalid clipboard data", error)
        return
      }
      pushHistory()
      pasteClipboard(data, position, selectedTrackIndex)
    },
    [pasteClipboard, position, pushHistory, selectedTrackIndex],
  )
}

export const useArrangeDeleteSelection = () => {
  const { pushHistory } = useHistory()
  const { setSelection, selection } = useArrangeView()
  const deleteSelection = useTracksCommand(deleteSelectionCmd)

  return useCallback(() => {
    if (selection === null) {
      return
    }
    pushHistory()
    deleteSelection(selection)
    setSelection(null)
  }, [deleteSelection, pushHistory, selection, setSelection])
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
  const transposeSelection = useTracksCommand(transposeSelectionCmd)

  return useCallback(
    (deltaPitch: number) => {
      if (selection === null) {
        return
      }
      pushHistory()
      transposeSelection(selection, deltaPitch)
    },
    [transposeSelection, pushHistory, selection],
  )
}

export const useArrangeDuplicateSelection = () => {
  const { pushHistory } = useHistory()
  const { selection, setSelection } = useArrangeView()
  const duplicateSelection = useTracksCommand(duplicateSelectionCmd)

  return useCallback(() => {
    if (selection === null) {
      return
    }
    pushHistory()
    const newSelection = duplicateSelection(selection)
    setSelection(newSelection ?? null)
  }, [selection, pushHistory, setSelection, duplicateSelection])
}

export const useArrangeBatchUpdateSelectedNotesVelocity = () => {
  const { pushHistory } = useHistory()
  const { selection } = useArrangeView()
  const batchUpdateVelocity = useTracksCommand(
    batchUpdateArrangeNotesVelocityCmd,
  )

  return useCallback(
    (operation: BatchUpdateOperation) => {
      if (selection === null) {
        return
      }
      pushHistory()
      batchUpdateVelocity(selection, operation)
    },
    [batchUpdateVelocity, pushHistory, selection],
  )
}
