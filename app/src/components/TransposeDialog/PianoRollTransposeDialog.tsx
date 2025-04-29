import { observer } from "mobx-react-lite"
import { useCallback } from "react"
import { useTransposeSelection } from "../../actions"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { TransposeDialog } from "./TransposeDialog"

export const PianoRollTransposeDialog = observer(() => {
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
})
