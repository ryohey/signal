import { useCallback } from "react"
import { panMidiEvent } from "../midi/MidiEvent"
import { useHistory } from "./useHistory"
import { usePianoRoll } from "./usePianoRoll"
import { usePlayer } from "./usePlayer"
import { useTrack } from "./useTrack"

const PAN_CENTER = 64

export function usePanSlider() {
  const { currentPan, selectedTrackId: trackId } = usePianoRoll()
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { setPan, channel } = useTrack(trackId)

  const setTrackPan = useCallback(
    (pan: number) => {
      pushHistory()
      setPan(pan, position)

      if (channel !== undefined) {
        sendEvent(panMidiEvent(0, channel, pan))
      }
    },
    [pushHistory, setPan, position, sendEvent, channel],
  )

  return {
    value: currentPan ?? PAN_CENTER,
    setValue: setTrackPan,
    defaultValue: PAN_CENTER,
  }
}
