import { getMeasureStartTick as getMeasureStartTickCmd } from "@signal-app/core"
import { useCallback } from "react"
import { useSongCommand } from "../../../hooks/useCommand"
import { useConductorTrack } from "../../../hooks/useConductorTrack"
import { useHistory } from "../../../hooks/useHistory"

export const useAddTimeSignature = () => {
  const { pushHistory } = useHistory()
  const getMeasureStartTick = useSongCommand(getMeasureStartTickCmd)
  const { hasTimeSignatureAt, addTimeSignature } = useConductorTrack()

  return useCallback(
    (tick: number, numerator: number, denominator: number) => {
      const measureStartTick = getMeasureStartTick(tick)

      // prevent duplication
      if (hasTimeSignatureAt(measureStartTick)) {
        return
      }

      pushHistory()
      addTimeSignature(measureStartTick, numerator, denominator)
    },
    [pushHistory, getMeasureStartTick, addTimeSignature, hasTimeSignatureAt],
  )
}
