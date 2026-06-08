import { getPan, panMidiEvent } from "@signal-app/core"
import { useCallback, useState, useSyncExternalStore } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useTrack } from "../../../hooks/useTrack"
import { usePianoRoll } from "./usePianoRoll"

const PAN_CENTER = 64
const noop = () => () => {}

export function usePanSlider() {
  const { selectedTrack, selectedTrackId: trackId } = usePianoRoll()
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { setPan, channel } = useTrack(trackId)
  const [isDragging, setIsDragging] = useState(false)

  const currentPan = useSyncExternalStore(
    selectedTrack?.onEventsChanged.subscribe ?? noop,
    useCallback(
      () => getPan(selectedTrack?.events ?? [], position) ?? PAN_CENTER,
      [selectedTrack, position],
    ),
  )

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
