import { useMobxStore } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"
import { useTrack } from "./useTrack"

export function useNotes() {
  const { selectedTrackId } = usePianoRoll()
  const { isRhythmTrack } = useTrack(selectedTrackId)

  return {
    get notes() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.notes)
    },
    isRhythmTrack,
  }
}
