import {
  getVolume,
  isVolumeEvent,
  setVolume,
  volumeMidiEvent,
} from "@signal-app/core"
import { useCallback, useMemo, useState } from "react"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useSyncTrackQuery } from "../../../hooks/useSyncTrackQuery"
import { useTrack } from "../../../hooks/useTrack"
import { usePianoRoll } from "../hooks/usePianoRoll"

const DEFAULT_VOLUME = 100

export function useVolumeSlider() {
  const { selectedTrack, selectedTrackId: trackId } = usePianoRoll()
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel } = useTrack(trackId)
  const mutateTrack = useMutateTrack(trackId)
  const [isDragging, setIsDragging] = useState(false)
  const query = useMemo(() => getVolume(position), [position])
  const currentVolumeEvent = useSyncTrackQuery(
    selectedTrack,
    query,
    isVolumeEvent,
  )

  const setTrackVolume = useCallback(
    (volume: number) => {
      if (!isDragging) {
        // record history for the keyboard event (no dragging)
        pushHistory()
      }

      mutateTrack(setVolume(volume, position))

      if (channel !== undefined) {
        sendEvent(volumeMidiEvent(0, channel, volume))
      }
    },
    [pushHistory, mutateTrack, position, sendEvent, channel, isDragging],
  )

  return {
    value: currentVolumeEvent?.value ?? DEFAULT_VOLUME,
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
