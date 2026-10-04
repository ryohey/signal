import type { BatchUpdateOperation } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { usePianoRoll } from "./usePianoRoll"
import { usePianoRollEditor } from "./usePianoRollEditor"

const useBatchUpdateSelectedNotesVelocity = () => {
  const { selectedNoteIds } = usePianoRoll()
  const { pushHistory } = useHistory()
  const pianoRollEditor = usePianoRollEditor()

  return useCallback(
    (operation: BatchUpdateOperation) => {
      pushHistory()
      pianoRollEditor.batchUpdateNotesVelocity(selectedNoteIds, operation)
    },
    [selectedNoteIds, pushHistory, pianoRollEditor],
  )
}

export function usePianoRollVelocityDialog() {
  return {
    setOpen: useSetAtom(openVelocityDialogAtom),
    get isOpen() {
      return useAtomValue(openVelocityDialogAtom)
    },
    updateVelocity: useBatchUpdateSelectedNotesVelocity(),
  }
}

// atoms
const openVelocityDialogAtom = atom<boolean>(false)
