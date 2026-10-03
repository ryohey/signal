import { useCallback } from "react"
import { useUpdateControlEventValue } from "../../actions/control"
import { ValueEventType } from "../../entities/event/ValueEventType"
import { useControlPane } from "../../hooks/useControlPane"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { useTrack } from "../../hooks/useTrack"
import { ControlName } from "../ControlPane/ControlName"
import { ControlValueDialog } from "./ControlValueDialog"

export const PianoRollControlValueDialog = () => {
  const { controlMode, valueDialogEventId, setValueDialogEventId } =
    useControlPane()
  const { selectedTrackId } = usePianoRoll()
  const { getEventById } = useTrack(selectedTrackId)
  const updateControlEventValue = useUpdateControlEventValue()

  const onClose = useCallback(
    () => setValueDialogEventId(null),
    [setValueDialogEventId],
  )

  const onClickOK = useCallback(
    (value: number) => {
      if (controlMode.type === "velocity" || valueDialogEventId === null) {
        return
      }
      updateControlEventValue(controlMode, valueDialogEventId, value)
      setValueDialogEventId(null)
    },
    [
      controlMode,
      valueDialogEventId,
      setValueDialogEventId,
      updateControlEventValue,
    ],
  )

  if (controlMode.type === "velocity") {
    return null
  }

  const { min, max } = ValueEventType.getDisplayValueRange(controlMode)

  const event =
    valueDialogEventId !== null ? getEventById(valueDialogEventId) : undefined
  const initialValue =
    event !== undefined && "value" in event
      ? ValueEventType.toDisplayValue(controlMode, event.value)
      : 0

  return (
    <ControlValueDialog
      open={valueDialogEventId !== null}
      title={<ControlName mode={controlMode} />}
      value={initialValue}
      minValue={min}
      maxValue={max}
      onClickOK={onClickOK}
      onClose={onClose}
    />
  )
}
