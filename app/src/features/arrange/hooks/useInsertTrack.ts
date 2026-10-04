import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { useSong } from "../../../hooks/useSong"

export const useInsertTrack = () => {
  const { pushHistory } = useHistory()
  const { insertNewTrack } = useSong()

  return useCallback(
    (trackIndex: number) => {
      pushHistory()
      insertNewTrack(trackIndex)
    },
    [pushHistory, insertNewTrack],
  )
}
