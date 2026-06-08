import { BatchUpdateOperation } from "@signal-app/core"
import { useCallback } from "react"
import { VelocityDialog } from "../../../components/VelocityDialog/VelocityDialog"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { useArrangeBatchUpdateSelectedNotesVelocity } from "../hooks/arrangeView"
import { useArrangeView } from "../hooks/useArrangeView"

export const ArrangeVelocityDialog = () => {
  const { newNoteVelocity } = usePianoRoll()
  const { openVelocityDialog, setOpenVelocityDialog } = useArrangeView()
  const arrangeBatchUpdateSelectedNotesVelocity =
    useArrangeBatchUpdateSelectedNotesVelocity()

  const onClose = useCallback(
    () => setOpenVelocityDialog(false),
    [setOpenVelocityDialog],
  )

  const onClickOK = useCallback(
    (value: number, operationType: BatchUpdateOperation["type"]) => {
      arrangeBatchUpdateSelectedNotesVelocity({
        type: operationType,
        value,
      })
      setOpenVelocityDialog(false)
    },
    [setOpenVelocityDialog, arrangeBatchUpdateSelectedNotesVelocity],
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
