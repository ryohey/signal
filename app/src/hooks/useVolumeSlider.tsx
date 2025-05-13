import { useCallback } from "react"
import { panMidiEvent } from "../midi/MidiEvent"
import { useHistory } from "./useHistory"
import { usePianoRoll } from "./usePianoRoll"
import { usePlayer } from "./usePlayer"
import { useTrack } from "./useTrack"

const DEFAULT_VOLUME = 100

export function useVolumeSlider() {
  const { currentVolume, selectedTrackId: trackId } = usePianoRoll()
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { setVolume, channel } = useTrack(trackId)

  const setTrackVolume = useCallback(
    (pan: number) => {
      pushHistory()
      setVolume(pan, position)

      if (channel !== undefined) {
        sendEvent(panMidiEvent(0, channel, pan))
      }
    },
    [pushHistory, setVolume, position, sendEvent, channel],
  )

  return {
    value: currentVolume ?? DEFAULT_VOLUME,
    setValue: setTrackVolume,
  }
}
