import {
  addTimeSignature,
  getMeasureStartTick as getMeasureStartTickCmd,
  hasTimeSignatureAt,
} from "@signal-app/core"
import { useCallback } from "react"
import {
  useMutateConductorTrack,
  useSongCommand,
} from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { useConductorTrackQuery } from "../../../hooks/useTrackQuery"

export const useAddTimeSignature = () => {
  const { pushHistory } = useHistory()
  const getMeasureStartTick = useSongCommand(getMeasureStartTickCmd)
  const mutate = useMutateConductorTrack()
  const query = useConductorTrackQuery()

  return useCallback(
    (tick: number, numerator: number, denominator: number) => {
      const measureStartTick = getMeasureStartTick(tick)

      // prevent duplication
      if (
        query((events) =>
          hasTimeSignatureAt(measureStartTick)(events.getArray()),
        )
      ) {
        return
      }

      pushHistory()

      mutate(addTimeSignature(measureStartTick, numerator, denominator))
    },
    [pushHistory, getMeasureStartTick, mutate, query],
  )
}
