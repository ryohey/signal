import { NoteNumber } from "../../../../entities/unit/NoteNumber"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { useHistory } from "../../../../hooks/useHistory"
import { useSong } from "../../../../hooks/useSong"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { NoteEvent } from "../../../../track"
import { useDragNoteCenterGesture } from "./useDragNoteEdgeGesture"

export const useCreateNoteGesture = (): MouseGesture => {
  const {
    transform, 
    selectedTrack, 
    quantizer, 
    newNoteVelocity,
    lastNoteDuration,
    getLocal
  } = usePianoRoll()
  const { timebase } = useSong()
  const { pushHistory } = useHistory()
  const dragNoteCenterAction = useDragNoteCenterGesture()

  return {
    onMouseDown(e) {
      if (e.shiftKey) {
        return
      }

      const local = getLocal(e)
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
        : (lastNoteDuration ?? quantizer.unit)

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
