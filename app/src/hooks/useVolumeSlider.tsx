import { useSetTrackVolume } from "../actions"
import { usePianoRoll } from "./usePianoRoll"

const DEFAULT_VOLUME = 100

export function useVolumeSlider() {
  const { currentVolume, selectedTrackId: trackId } = usePianoRoll()
  const setTrackVolume = useSetTrackVolume(trackId)
  return {
    value: currentVolume ?? DEFAULT_VOLUME,
    setValue: setTrackVolume,
  }
}
