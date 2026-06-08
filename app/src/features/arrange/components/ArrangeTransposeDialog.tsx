import { useCallback } from "react"
import { TransposeDialog } from "../../../components/TransposeDialog/TransposeDialog"
import { useArrangeTransposeSelection } from "../hooks/arrangeView"
import { useArrangeView } from "../hooks/useArrangeView"

export const ArrangeTransposeDialog = () => {
  const { openTransposeDialog, setOpenTransposeDialog } = useArrangeView()
  const arrangeTransposeSelection = useArrangeTransposeSelection()

  const onClose = useCallback(
    () => setOpenTransposeDialog(false),
    [setOpenTransposeDialog],
  )

  const onClickOK = useCallback(
    (value: number) => {
      arrangeTransposeSelection(value)
      setOpenTransposeDialog(false)
    },
    [setOpenTransposeDialog, arrangeTransposeSelection],
  )

  return (
    <TransposeDialog
      open={openTransposeDialog}
      onClose={onClose}
      onClickOK={onClickOK}
    />
  )
}
