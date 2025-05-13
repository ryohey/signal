import { useSetTrackPan } from "../actions"
import { usePianoRoll } from "./usePianoRoll"

const PAN_CENTER = 64

export function usePanSlider() {
  const { currentPan, selectedTrackId: trackId } = usePianoRoll()
  const setTrackPan = useSetTrackPan(trackId)
  return {
    value: currentPan ?? PAN_CENTER,
    setValue: setTrackPan,
    defaultValue: PAN_CENTER,
  }
}
