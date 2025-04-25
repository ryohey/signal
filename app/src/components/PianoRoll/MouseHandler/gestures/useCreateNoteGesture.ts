import { NoteNumber } from "../../../../entities/unit/NoteNumber"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { useHistory } from "../../../../hooks/useHistory"
import { useSong } from "../../../../hooks/useSong"
import { useStores } from "../../../../hooks/useStores"
import { NoteEvent } from "../../../../track"
import { useDragNoteCenterGesture } from "./useDragNoteEdgeGesture"

export const useCreateNoteGesture = (): MouseGesture => {
  const {
    pianoRollStore,
    pianoRollStore: { transform, selectedTrack, quantizer, newNoteVelocity },
  } = useStores()
  const { timebase } = useSong()
  const { pushHistory } = useHistory()
  const dragNoteCenterAction = useDragNoteCenterGesture()

  return {
    onMouseDown(e) {
      if (e.shiftKey) {
        return
      }

      const local = pianoRollStore.getLocal(e)
      const { tick, noteNumber } = transform.getNotePoint(local)

      if (
        selectedTrack === undefined ||
        selectedTrack.channel == undefined ||
        !NoteNumber.isValid(noteNumber)
      ) {
        return
      }

      pushHistory()

      const quantizedTick = selectedTrack.isRhythmTrack
        ? quantizer.round(tick)
        : quantizer.floor(tick)

      const duration = selectedTrack.isRhythmTrack
        ? timebase / 8 // 32th note in the rhythm track
        : (pianoRollStore.lastNoteDuration ?? quantizer.unit)

      const note = selectedTrack.addEvent({
        type: "channel",
        subtype: "note",
        noteNumber: noteNumber,
        tick: quantizedTick,
        velocity: newNoteVelocity,
        duration,
      } as NoteEvent)

      if (note === undefined) {
        return
      }

      dragNoteCenterAction.onMouseDown(e, note.id)
    },
  }
}
