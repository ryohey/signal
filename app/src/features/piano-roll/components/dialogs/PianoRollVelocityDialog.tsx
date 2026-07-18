import { BatchUpdateOperation } from "@signal-app/core"
import { useCallback } from "react"
import { VelocityDialog } from "../../../../components/VelocityDialog/VelocityDialog"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { usePianoRollVelocityDialog } from "../../hooks/usePianoRollVelocityDialog"

export const PianoRollVelocityDialog = () => {
  const { newNoteVelocity } = usePianoRoll()
  const { isOpen, setOpen, updateVelocity } = usePianoRollVelocityDialog()

  const onClose = useCallback(() => setOpen(false), [setOpen])

  const onClickOK = useCallback(
    (value: number, operationType: BatchUpdateOperation["type"]) => {
      updateVelocity({
        type: operationType,
        value,
      })
      setOpen(false)
    },
    [setOpen, updateVelocity],
  )

  return (
    <VelocityDialog
      open={isOpen}
      value={newNoteVelocity}
      onClickOK={onClickOK}
      onClose={onClose}
    />
  )
}
