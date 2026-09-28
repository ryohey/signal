import {
  isVolumeEvent,
  Track,
  TrackId,
  volumeMidiEvent,
} from "@signal-app/core"
import { useCallback, useState } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useSyncTrackQuery } from "../../../hooks/useSyncTrackQuery"
import { useTrack } from "../../../hooks/useTrack"
import { usePianoRoll } from "../hooks/usePianoRoll"

const DEFAULT_VOLUME = 100

function useCurrentVolume(trackId: TrackId) {
  const { position } = usePlayer()
  const query = useCallback(
    (track: Track) => track.getVolume(position)?.value,
    [position],
  )
  return useSyncTrackQuery(trackId, query, isVolumeEvent)
}

export function useVolumeSlider() {
  const { selectedTrackId: trackId } = usePianoRoll()
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel, setVolume } = useTrack(trackId)
  const [isDragging, setIsDragging] = useState(false)
  const currentVolume = useCurrentVolume(trackId)

  const setTrackVolume = useCallback(
    (volume: number) => {
      if (!isDragging) {
        // record history for the keyboard event (no dragging)
        pushHistory()
      }

      setVolume(volume, position)

      if (channel !== undefined) {
        sendEvent(volumeMidiEvent(0, channel, volume))
      }
    },
    [pushHistory, setVolume, position, sendEvent, channel, isDragging],
  )

  return {
    value: currentVolume ?? DEFAULT_VOLUME,
    setValue: setTrackVolume,
    onPointerDown: useCallback(() => {
      // record history only when dragging starts
      pushHistory()
      setIsDragging(true)
    }, [pushHistory]),
    onPointerUp: useCallback(() => {
      setIsDragging(false)
    }, []),
  }
}
