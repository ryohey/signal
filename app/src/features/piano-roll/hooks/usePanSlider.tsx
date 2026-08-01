import {
  getPan,
  isPanEvent,
  panMidiEvent,
  selectorToQuery,
  setPan,
} from "@signal-app/core"
import { useCallback, useMemo, useState } from "react"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useSyncTrackQuery } from "../../../hooks/useSyncTrackQuery"
import { useTrack } from "../../../hooks/useTrack"
import { usePianoRoll } from "./usePianoRoll"

const PAN_CENTER = 64

export function usePanSlider() {
  const { selectedTrackId: trackId } = usePianoRoll()
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel } = useTrack(trackId)
  const mutateTrack = useMutateTrack(trackId)
  const [isDragging, setIsDragging] = useState(false)
  const query = useMemo(() => selectorToQuery(getPan(position)), [position])
  const currentPanEvent = useSyncTrackQuery(trackId, query, isPanEvent)

  const setTrackPan = useCallback(
    (pan: number) => {
      if (!isDragging) {
        // record history for the keyboard event (no dragging)
        pushHistory()
      }

      mutateTrack(setPan(pan, position))

      if (channel !== undefined) {
        sendEvent(panMidiEvent(0, channel, pan))
      }
    },
    [pushHistory, mutateTrack, position, sendEvent, channel, isDragging],
  )

  return {
    value: currentPanEvent?.value ?? PAN_CENTER,
    setValue: setTrackPan,
    defaultValue: PAN_CENTER,
    onPointerDown: useCallback(() => {
      pushHistory()
      setIsDragging(true)
    }, [pushHistory]),
    onPointerUp: useCallback(() => {
      setIsDragging(false)
    }, []),
  }
}
