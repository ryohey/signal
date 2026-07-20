import { updateEvent } from "@signal-app/core"
import { useCallback } from "react"
import { useMutateConductorTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"

export const useUpdateTimeSignature = () => {
  const mutate = useMutateConductorTrack()
  const { pushHistory } = useHistory()

  return useCallback(
    (id: number, numerator: number, denominator: number) => {
      pushHistory()
      mutate(updateEvent(id, { numerator, denominator }))
    },
    [pushHistory, mutate],
  )
}
