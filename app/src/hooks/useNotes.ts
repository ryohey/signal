import { useMobxSelector, useMobxStore } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"

export function useNotes() {
  const { selectedTrack } = usePianoRoll()
  const isRhythmTrack = useMobxSelector(
    () => selectedTrack?.isRhythmTrack ?? false,
    [selectedTrack],
  )

  return {
    get notes() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.notes)
    },
    isRhythmTrack,
  }
}
