import { ValueEventType } from "@signal-app/control-editor"
import { useCallback } from "react"
import { useUpdateControlEventValue } from "../../hooks/control"
import { useControlEditor } from "../../hooks/useControlEditor"
import { useControlPane } from "../../hooks/useControlPane"
import { ControlName } from "../ControlName"
import { ControlValueDialog } from "./ControlValueDialog"

export const ControlEventValueDialog = () => {
  const { valueDialogEventId, setValueDialogEventId } = useControlPane()
  const controlEditor = useControlEditor()
  const updateControlEventValue = useUpdateControlEventValue()
  const { type } = controlEditor

  const onClose = useCallback(
    () => setValueDialogEventId(null),
    [setValueDialogEventId],
  )

  const onClickOK = useCallback(
    (value: number) => {
      if (valueDialogEventId === null) {
        return
      }
      updateControlEventValue(valueDialogEventId, value)
      setValueDialogEventId(null)
    },
    [valueDialogEventId, setValueDialogEventId, updateControlEventValue],
  )

  const { min, max } = ValueEventType.getDisplayValueRange(type)

  const [item] =
    valueDialogEventId !== null
      ? controlEditor.getItemsByIds([valueDialogEventId])
      : []
  const initialValue =
    item !== undefined ? ValueEventType.toDisplayValue(type, item.value) : 0

  return (
    <ControlValueDialog
      open={valueDialogEventId !== null}
      title={<ControlName mode={type} />}
      value={initialValue}
      minValue={min}
      maxValue={max}
      onClickOK={onClickOK}
      onClose={onClose}
    />
  )
}
