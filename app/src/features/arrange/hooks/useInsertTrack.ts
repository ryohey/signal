import { insertNewTrack as insertNewTrackCmd } from "@signal-app/core"
import { useCallback } from "react"
import { useSongCommand } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"

export const useInsertTrack = () => {
  const { pushHistory } = useHistory()
  const insertNewTrack = useSongCommand(insertNewTrackCmd)

  return useCallback(
    (trackIndex: number) => {
      pushHistory()
      insertNewTrack(trackIndex)
    },
    [pushHistory, insertNewTrack],
  )
}
