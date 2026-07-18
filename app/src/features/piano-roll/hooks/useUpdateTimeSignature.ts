import { useCallback } from "react"
import { useConductorTrack } from "../../../hooks/useConductorTrack"
import { useHistory } from "../../../hooks/useHistory"

export const useUpdateTimeSignature = () => {
  const { updateEvent } = useConductorTrack()
  const { pushHistory } = useHistory()

  return useCallback(
    (id: number, numerator: number, denominator: number) => {
      pushHistory()
      updateEvent(id, {
        numerator,
        denominator,
      })
    },
    [pushHistory, updateEvent],
  )
}
