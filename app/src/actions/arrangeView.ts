import {
  ArrangeNotesClipboardDataSchema,
  BatchUpdateOperation,
} from "@signal-app/core"
import { useCallback } from "react"
import { useArrangeView } from "../hooks/useArrangeView"
import { useCommands } from "../hooks/useCommands"
import { useHistory } from "../hooks/useHistory"
import { usePlayer } from "../hooks/usePlayer"
import {
  readClipboardData,
  readJSONFromClipboard,
  writeClipboardData,
} from "../services/Clipboard"

export const useArrangeCopySelection = () => {
  const { selection } = useArrangeView()
  const commands = useCommands()

  return useCallback(() => {
    if (selection === null) {
      return
    }
    const data = commands.arrange.getClipboardDataForSelection(selection)
    writeClipboardData(data)
  }, [commands, selection])
}

export const useArrangePasteSelection = () => {
  const { position } = usePlayer()
  const { pushHistory } = useHistory()
  const { selectedTrackIndex } = useArrangeView()
  const commands = useCommands()

  return useCallback(
    async (e?: ClipboardEvent) => {
      const obj = e ? readJSONFromClipboard(e) : await readClipboardData()
      const { data, error } = ArrangeNotesClipboardDataSchema.safeParse(obj)
      if (!data) {
        console.error("Invalid clipboard data", error)
        return
      }
      pushHistory()
      commands.arrange.pasteClipboardDataAt(data, position, selectedTrackIndex)
    },
    [commands, position, pushHistory, selectedTrackIndex],
  )
}

export const useArrangeDeleteSelection = () => {
  const { pushHistory } = useHistory()
  const { setSelection, selection } = useArrangeView()
  const commands = useCommands()

  return useCallback(() => {
    if (selection === null) {
      return
    }
    pushHistory()
    commands.arrange.deleteSelection(selection)
    setSelection(null)
  }, [commands, pushHistory, selection, setSelection])
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
  const commands = useCommands()

  return useCallback(
    (deltaPitch: number) => {
      if (selection === null) {
        return
      }
      pushHistory()
      commands.arrange.transposeSelection(selection, deltaPitch)
    },
    [commands, pushHistory, selection],
  )
}

export const useArrangeDuplicateSelection = () => {
  const { pushHistory } = useHistory()
  const { selection, setSelection } = useArrangeView()
  const commands = useCommands()

  return useCallback(() => {
    if (selection === null) {
      return
    }
    pushHistory()
    const newSelection = commands.arrange.duplicateSelection(selection)
    setSelection(newSelection)
  }, [selection, pushHistory, setSelection, commands])
}

export const useArrangeBatchUpdateSelectedNotesVelocity = () => {
  const { pushHistory } = useHistory()
  const { selection } = useArrangeView()
  const commands = useCommands()

  return useCallback(
    (operation: BatchUpdateOperation) => {
      if (selection === null) {
        return
      }
      pushHistory()
      commands.arrange.batchUpdateNotesVelocity(selection, operation)
    },
    [commands, pushHistory, selection],
  )
}
