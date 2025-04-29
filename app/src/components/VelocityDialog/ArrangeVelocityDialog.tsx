import { useCallback } from "react"
import {
  BatchUpdateOperation,
  useArrangeBatchUpdateSelectedNotesVelocity,
} from "../../actions"
import { useArrangeView } from "../../hooks/useArrangeView"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { VelocityDialog } from "./VelocityDialog"

export const ArrangeVelocityDialog = () => {
  const { newNoteVelocity } = usePianoRoll()
  const { openVelocityDialog, setOpenTransposeDialog } = useArrangeView()
  const arrangeBatchUpdateSelectedNotesVelocity =
    useArrangeBatchUpdateSelectedNotesVelocity()

  const onClose = useCallback(
    () => setOpenTransposeDialog(false),
    [setOpenTransposeDialog],
  )

  const onClickOK = useCallback(
    (value: number, operationType: BatchUpdateOperation["type"]) => {
      arrangeBatchUpdateSelectedNotesVelocity({
        type: operationType,
        value,
      })
      setOpenTransposeDialog(false)
    },
    [setOpenTransposeDialog, arrangeBatchUpdateSelectedNotesVelocity],
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
