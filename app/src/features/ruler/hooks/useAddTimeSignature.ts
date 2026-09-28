import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { useRulerEditor } from "./useRulerEditor"

export const useAddTimeSignature = () => {
  const { pushHistory } = useHistory()
  const { getMeasureStartTick, hasTimeSignatureAt, addTimeSignature } =
    useRulerEditor()

  return useCallback(
    (tick: number, numerator: number, denominator: number) => {
      // prevent duplication
      if (hasTimeSignatureAt(getMeasureStartTick(tick))) {
        return
      }

      pushHistory()
      addTimeSignature(tick, numerator, denominator)
    },
    [pushHistory, getMeasureStartTick, hasTimeSignatureAt, addTimeSignature],
  )
}
