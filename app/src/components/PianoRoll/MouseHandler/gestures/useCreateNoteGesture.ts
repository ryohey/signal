import { NoteEvent, NoteNumber } from "@signal-app/core"
import { useCallback } from "react"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { useHistory } from "../../../../hooks/useHistory"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { useQuantizer } from "../../../../hooks/useQuantizer"
import { useSong } from "../../../../hooks/useSong"
import { useTrack } from "../../../../hooks/useTrack"
import { useDragNoteCenterGesture } from "./useDragNoteEdgeGesture"

export const useCreateNoteGesture = (): MouseGesture => {
  const {
    transform,
    selectedTrackId,
    newNoteVelocity,
    lastNoteDuration,
    getLocal,
  } = usePianoRoll()
  const { quantizeRound, quantizeFloor, quantizeUnit } = useQuantizer()
  const { channel, isRhythmTrack, addEvent } = useTrack(selectedTrackId)
  const { timebase } = useSong()
  const { pushHistory } = useHistory()
  const dragNoteCenterAction = useDragNoteCenterGesture()

  return {
    onMouseDown: useCallback(
      (e) => {
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
          ? quantizeRound(tick)
          : quantizeFloor(tick)

        const duration = isRhythmTrack
          ? timebase / 8 // 32th note in the rhythm track
          : (lastNoteDuration ?? quantizeUnit)

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
      [
        transform,
        getLocal,
        channel,
        isRhythmTrack,
        quantizeRound,
        quantizeFloor,
        quantizeUnit,
        timebase,
        newNoteVelocity,
        lastNoteDuration,
        addEvent,
        pushHistory,
        dragNoteCenterAction,
      ],
    ),
  }
}
