import { ValueEventType } from "@signal-app/control-editor"
import { useCallback } from "react"
import { useUpdateControlEventsValue } from "../../hooks/control"
import { useControlEditor } from "../../hooks/useControlEditor"
import { useControlPane } from "../../hooks/useControlPane"
import { ControlName } from "../ControlName"
import { ControlValueDialog } from "./ControlValueDialog"

export const ControlEventValueDialog = () => {
  const { selectedEventIds, isValueDialogOpen, setValueDialogOpen } =
    useControlPane()
  const controlEditor = useControlEditor()
  const updateControlEventsValue = useUpdateControlEventsValue()
  const { type } = controlEditor

  const onClose = useCallback(
    () => setValueDialogOpen(false),
    [setValueDialogOpen],
  )

  const onClickOK = useCallback(
    (value: number) => {
      updateControlEventsValue(selectedEventIds, value)
      setValueDialogOpen(false)
    },
    [selectedEventIds, setValueDialogOpen, updateControlEventsValue],
  )

  const { min, max } = ValueEventType.getDisplayValueRange(type)

  // start from the value of the first selected point
  const [item] = controlEditor.getItemsByIds(selectedEventIds)
  const initialValue =
    item !== undefined ? ValueEventType.toDisplayValue(type, item.value) : 0

  return (
    <ControlValueDialog
      open={isValueDialogOpen}
      title={<ControlName mode={type} />}
      value={initialValue}
      minValue={min}
      maxValue={max}
      onClickOK={onClickOK}
      onClose={onClose}
    />
  )
}
