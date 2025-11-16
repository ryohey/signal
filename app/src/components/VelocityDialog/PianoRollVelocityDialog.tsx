import { useCallback } from "react"
import { useBatchUpdateSelectedNotesVelocity } from "../../actions"
import { BatchUpdateOperation } from "../../commands/track"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { VelocityDialog } from "./VelocityDialog"

export const PianoRollVelocityDialog = () => {
  const { openVelocityDialog, newNoteVelocity, setOpenVelocityDialog } =
    usePianoRoll()
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
}
