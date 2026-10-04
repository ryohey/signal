import {
  isPanEvent,
  panMidiEvent,
  type Track,
  type TrackId,
} from "@signal-app/core"
import { useCallback, useState } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useSyncTrackQuery } from "../../../hooks/useSyncTrackQuery"
import { useTrack } from "../../../hooks/useTrack"
import { usePianoRoll } from "./usePianoRoll"

const PAN_CENTER = 64

function useCurrentPan(trackId: TrackId) {
  const { position } = usePlayer()
  const query = useCallback(
    (track: Track) => track?.getPan(position)?.value,
    [position],
  )
  return useSyncTrackQuery(trackId, query, isPanEvent)
}

export function usePanSlider() {
  const { selectedTrackId: trackId } = usePianoRoll()
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel, setPan } = useTrack(trackId)
  const [isDragging, setIsDragging] = useState(false)
  const currentPan = useCurrentPan(trackId)

  const setTrackPan = useCallback(
    (pan: number) => {
      if (!isDragging) {
        // record history for the keyboard event (no dragging)
        pushHistory()
      }

      setPan(pan, position)

      if (channel !== undefined) {
        sendEvent(panMidiEvent(0, channel, pan))
      }
    },
    [pushHistory, setPan, position, sendEvent, channel, isDragging],
  )

  return {
    value: currentPan ?? PAN_CENTER,
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
