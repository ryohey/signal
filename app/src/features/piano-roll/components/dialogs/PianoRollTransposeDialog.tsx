import { useCallback } from "react"
import { TransposeDialog } from "../../../../components/TransposeDialog/TransposeDialog"
import { useTransposeSelection } from "../../hooks/selection"
import { usePianoRoll } from "../../hooks/usePianoRoll"

export const PianoRollTransposeDialog = () => {
  const { openTransposeDialog, setOpenTransposeDialog } = usePianoRoll()
  const transposeSelection = useTransposeSelection()

  const onClose = useCallback(
    () => setOpenTransposeDialog(false),
    [setOpenTransposeDialog],
  )

  const onClickOK = useCallback(
    (value: number) => {
      transposeSelection(value)
      setOpenTransposeDialog(false)
    },
    [setOpenTransposeDialog, transposeSelection],
  )

  return (
    <TransposeDialog
      open={openTransposeDialog}
      onClose={onClose}
      onClickOK={onClickOK}
    />
  )
}
