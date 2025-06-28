import { NoteNumber } from "../../../../entities/unit/NoteNumber"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { useHistory } from "../../../../hooks/useHistory"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { useQuantizer } from "../../../../hooks/useQuantizer"
import { useSong } from "../../../../hooks/useSong"
import { useTrack } from "../../../../hooks/useTrack"
import { NoteEvent } from "../../../../track"
import { useDragNoteCenterGesture } from "./useDragNoteEdgeGesture"

export const useCreateNoteGesture = (): MouseGesture => {
  const {
    transform,
    selectedTrackId,
    newNoteVelocity,
    lastNoteDuration,
    getLocal,
  } = usePianoRoll()
  const { quantizer } = useQuantizer()
  const { channel, isRhythmTrack, addEvent } = useTrack(selectedTrackId)
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

      if (channel == undefined || !NoteNumber.isValid(noteNumber)) {
        return
      }

      pushHistory()

      const quantizedTick = isRhythmTrack
        ? quantizer.round(tick)
        : quantizer.floor(tick)

      const duration = isRhythmTrack
        ? timebase / 8 // 32th note in the rhythm track
        : (lastNoteDuration ?? quantizer.unit)

      const note = addEvent({
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
