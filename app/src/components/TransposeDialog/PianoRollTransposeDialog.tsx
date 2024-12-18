import { observer } from "mobx-react-lite"
import { useCallback } from "react"
import { useTransposeSelection } from "../../actions"
import { useStores } from "../../hooks/useStores"
import { TransposeDialog } from "./TransposeDialog"

export const PianoRollTransposeDialog = observer(() => {
  const rootStore = useStores()
  const { pianoRollStore } = rootStore
  const { openTransposeDialog } = pianoRollStore
  const transposeSelection = useTransposeSelection()

  const onClose = useCallback(
    () => (pianoRollStore.openTransposeDialog = false),
    [pianoRollStore],
  )

  const onClickOK = useCallback(
    (value: number) => {
      transposeSelection(value)
      pianoRollStore.openTransposeDialog = false
    },
    [pianoRollStore, transposeSelection],
  )

  return (
    <TransposeDialog
      open={openTransposeDialog}
      onClose={onClose}
      onClickOK={onClickOK}
    />
  )
})
