import { useCallback, useState } from "react"
import { panMidiEvent } from "../midi/MidiEvent"
import { useHistory } from "./useHistory"
import { useMobxSelector } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"
import { usePlayer } from "./usePlayer"
import { useTrack } from "./useTrack"

const PAN_CENTER = 64

export function usePanSlider() {
  const { selectedTrack, selectedTrackId: trackId } = usePianoRoll()
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { setPan, channel } = useTrack(trackId)
  const [isDragging, setIsDragging] = useState(false)

  const currentPan = useMobxSelector(() => {
    selectedTrack?.getPan(position)
  }, [selectedTrack, position])

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
