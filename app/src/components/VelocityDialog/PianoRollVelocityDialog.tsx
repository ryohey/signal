import { observer } from "mobx-react-lite"
import { useCallback } from "react"
import {
  BatchUpdateOperation,
  useBatchUpdateSelectedNotesVelocity,
} from "../../actions"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { VelocityDialog } from "./VelocityDialog"

export const PianoRollVelocityDialog = observer(() => {
  const { openVelocityDialog, newNoteVelocity, setOpenVelocityDialog } = usePianoRoll()
  const batchUpdateSelectedNotesVelocity = useBatchUpdateSelectedNotesVelocity()

  const onClose = useCallback(
    () => setOpenVelocityDialog(false),
    [setOpenVelocityDialog],
  )

  const onClickOK = useCallback(
    (value: number, operationType: BatchUpdateOperation["type"]) => {
      batchUpdateSelectedNotesVelocity({
        type: operationType,
        value,
      })
      setOpenVelocityDialog(false)
    },
    [setOpenVelocityDialog, batchUpdateSelectedNotesVelocity],
  )

  return (
    <VelocityDialog
      open={openVelocityDialog}
      value={newNoteVelocity}
      onClickOK={onClickOK}
      onClose={onClose}
    />
  )
})
