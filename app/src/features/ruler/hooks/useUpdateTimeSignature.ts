import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { useRulerEditor } from "./useRulerEditor"

export const useUpdateTimeSignature = () => {
  const { updateTimeSignature } = useRulerEditor()
  const { pushHistory } = useHistory()

  return useCallback(
    (id: number, numerator: number, denominator: number) => {
      pushHistory()
      updateTimeSignature(id, numerator, denominator)
    },
    [pushHistory, updateTimeSignature],
  )
}
