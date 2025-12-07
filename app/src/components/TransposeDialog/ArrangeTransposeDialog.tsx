import { useCallback } from "react"
import { useArrangeTransposeSelection } from "../../actions"
import { useArrangeView } from "../../hooks/useArrangeView"
import { TransposeDialog } from "./TransposeDialog"

export const ArrangeTransposeDialog = () => {
  const { openTransposeDialog, setOpenTransposeDialog } = useArrangeView()
  const arrangeTransposeSelection = useArrangeTransposeSelection()

  const onClose = useCallback(
    () => setOpenTransposeDialog(false),
    [setOpenTransposeDialog]
  )

  const onClickOK = useCallback(
    (value: number) => {
      arrangeTransposeSelection(value)
      setOpenTransposeDialog(false)
    },
    [setOpenTransposeDialog, arrangeTransposeSelection]
  )

  return (
    <TransposeDialog
      open={openTransposeDialog}
      onClose={onClose}
      onClickOK={onClickOK}
    />
  )
}
