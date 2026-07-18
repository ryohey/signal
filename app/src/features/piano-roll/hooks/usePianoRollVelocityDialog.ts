import {
  BatchUpdateOperation,
  batchUpdateNotesVelocity,
} from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { usePianoRoll } from "./usePianoRoll"

const useBatchUpdateSelectedNotesVelocity = () => {
  const { selectedTrackId, selectedNoteIds } = usePianoRoll()
  const { pushHistory } = useHistory()
  const mutate = useMutateTrack(selectedTrackId)

  return useCallback(
    (operation: BatchUpdateOperation) => {
      pushHistory()
      mutate(batchUpdateNotesVelocity(selectedNoteIds, operation))
    },
    [selectedNoteIds, pushHistory, mutate],
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
