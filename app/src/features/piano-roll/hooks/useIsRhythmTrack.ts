import { useTrack } from "../../../hooks/useTrack"
import { usePianoRoll } from "./usePianoRoll"

export function useIsRhythmTrack() {
  const { selectedTrackId } = usePianoRoll()
  const { isRhythmTrack } = useTrack(selectedTrackId)
  return isRhythmTrack
}
