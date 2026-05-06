import { getVolume, volumeMidiEvent } from "@signal-app/core"
import { useCallback, useState, useSyncExternalStore } from "react"
import { useHistory } from "./useHistory"
import { usePianoRoll } from "./usePianoRoll"
import { usePlayer } from "./usePlayer"
import { useTrack } from "./useTrack"

const DEFAULT_VOLUME = 100
const noop = () => () => {}

export function useVolumeSlider() {
  const { selectedTrack, selectedTrackId: trackId } = usePianoRoll()
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { setVolume, channel } = useTrack(trackId)
  const [isDragging, setIsDragging] = useState(false)

  const currentVolume = useSyncExternalStore(
    selectedTrack?.onEventsChanged.subscribe ?? noop,
    useCallback(
      () => getVolume(selectedTrack?.events ?? [], position) ?? DEFAULT_VOLUME,
      [selectedTrack, position],
    ),
  )

  const setTrackVolume = useCallback(
    (pan: number) => {
      if (!isDragging) {
        // record history for the keyboard event (no dragging)
        pushHistory()
      }

      setVolume(pan, position)

      if (channel !== undefined) {
        sendEvent(volumeMidiEvent(0, channel, pan))
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
