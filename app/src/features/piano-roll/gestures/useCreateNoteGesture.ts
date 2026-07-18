import { addEvent, NoteEvent, NoteNumber } from "@signal-app/core"
import { useCallback } from "react"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useSong } from "../../../hooks/useSong"
import { useTrack } from "../../../hooks/useTrack"
import { useNoteCoordTransform } from "../hooks/useNoteCoordTransform"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { useDragNoteCenterGesture } from "./useDragNoteEdgeGesture"

export const useCreateNoteGesture = (): MouseDownHandler => {
  const { selectedTrackId, newNoteVelocity, lastNoteDuration } = usePianoRoll()
  const { transform, getLocal } = useNoteCoordTransform()
  const { quantizeRound, quantizeFloor, quantizeUnit } = useQuantizer()
  const { channel, isRhythmTrack } = useTrack(selectedTrackId)
  const mutate = useMutateTrack(selectedTrackId)
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

      const note = mutate(
        addEvent<NoteEvent>({
          type: "channel",
          subtype: "note",
          noteNumber: noteNumber,
          tick: quantizedTick,
          velocity: newNoteVelocity,
          duration,
        }),
      )

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
      mutate,
      pushHistory,
      dragNoteCenterAction,
    ],
  )
}
