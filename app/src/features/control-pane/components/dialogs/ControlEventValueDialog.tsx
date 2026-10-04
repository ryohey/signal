import { ValueEventType } from "@signal-app/control-editor"
import { useCallback } from "react"
import { useUpdateControlEventsValue } from "../../hooks/control"
import { useControlEditor } from "../../hooks/useControlEditor"
import { useControlPane } from "../../hooks/useControlPane"
import { ControlName } from "../ControlName"
import { ControlValueDialog } from "./ControlValueDialog"

export const ControlEventValueDialog = () => {
  const { valueDialogEventIds, setValueDialogEventIds } = useControlPane()
  const controlEditor = useControlEditor()
  const updateControlEventsValue = useUpdateControlEventsValue()
  const { type } = controlEditor

  const onClose = useCallback(
    () => setValueDialogEventIds([]),
    [setValueDialogEventIds],
  )

  const onClickOK = useCallback(
    (value: number) => {
      updateControlEventsValue(valueDialogEventIds, value)
      setValueDialogEventIds([])
    },
    [valueDialogEventIds, setValueDialogEventIds, updateControlEventsValue],
  )

  const { min, max } = ValueEventType.getDisplayValueRange(type)

  // start from the value of the first point
  const [item] = controlEditor.getItemsByIds(valueDialogEventIds)
  const initialValue =
    item !== undefined ? ValueEventType.toDisplayValue(type, item.value) : 0

  return (
    <ControlValueDialog
      open={valueDialogEventIds.length > 0}
      title={<ControlName mode={type} />}
      value={initialValue}
      minValue={min}
      maxValue={max}
      onClickOK={onClickOK}
      onClose={onClose}
    />
  )
}
