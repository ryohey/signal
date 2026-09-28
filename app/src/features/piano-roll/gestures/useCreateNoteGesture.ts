import { NoteNumber } from "@signal-app/core"
import { useCallback } from "react"
import type { MouseDownHandler } from "../../../gesture/MouseGesture"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useSong } from "../../../hooks/useSong"
import { useTrack } from "../../../hooks/useTrack"
import { useNoteCoordTransform } from "../hooks/useNoteCoordTransform"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { usePianoRollEditor } from "../hooks/usePianoRollEditor"
import { useDragNoteCenterGesture } from "./useDragNoteEdgeGesture"

export const useCreateNoteGesture = (): MouseDownHandler => {
  const { selectedTrackId, newNoteVelocity, lastNoteDuration } = usePianoRoll()
  const { transform, getLocal } = useNoteCoordTransform()
  const { quantizeRound, quantizeFloor, quantizeUnit } = useQuantizer()
  const { channel, isRhythmTrack } = useTrack(selectedTrackId)
  const pianoRollEditor = usePianoRollEditor()
  const { timebase } = useSong()
  const { pushHistory } = useHistory()
  const dragNoteCenterAction = useDragNoteCenterGesture()

  return useCallback(
    (e) => {
      if (e.shiftKey) {
        return
      }

      const local = getLocal(e)
      const { tick, noteNumber } = transform.getNotePoint(local)

      if (channel === undefined || !NoteNumber.isValid(noteNumber)) {
        return
      }

      pushHistory()

      const quantizedTick = isRhythmTrack
        ? quantizeRound(tick)
        : quantizeFloor(tick)

      const duration = isRhythmTrack
        ? timebase / 8 // 32th note in the rhythm track
        : (lastNoteDuration ?? quantizeUnit)

      const note = pianoRollEditor.addNote({
        noteNumber: noteNumber,
        tick: quantizedTick,
        velocity: newNoteVelocity,
        duration,
      })

      if (note === undefined) {
        return
      }

      dragNoteCenterAction(e, note)
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
      pianoRollEditor,
      pushHistory,
      dragNoteCenterAction,
    ],
  )
}
