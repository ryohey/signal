import { isNoteEvent } from "@signal-app/core"
import { useCallback } from "react"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { usePreviewNote } from "../../../../hooks/usePreviewNote"
import { useQuantizer } from "../../../../hooks/useQuantizer"
import { useTrack } from "../../../../hooks/useTrack"

const VELOCITY_REPLAY_THRESHOLD = 10
const VELOCITY_PIXELS_PER_UNIT = 3

/**
 * Gesture used after creating a note with the pencil tool.
 * - Dragging on X-axis changes the note duration
 * - Dragging on Y-axis changes the note velocity (with replay on threshold)
 */
export const useCreateNoteDragGesture = (): MouseGesture<[number]> => {
  const {
    transform,
    selectedTrackId,
    setLastNoteDuration,
    setNewNoteVelocity,
  } = usePianoRoll()
  const { getEventById, updateEvent } = useTrack(selectedTrackId)
  const { isQuantizeEnabled, quantize: quantizeUnit } = useQuantizer()
  const { previewNoteOn, previewNoteOff } = usePreviewNote()

  return {
    onMouseDown: useCallback(
      (e, noteId) => {
        const note = getEventById(noteId)
        if (note === undefined || !isNoteEvent(note)) {
          return
        }

        const initialDuration = note.duration
        const initialVelocity = note.velocity
        let lastPreviewedVelocity = initialVelocity

        previewNoteOn(note.noteNumber, undefined, initialVelocity)

        observeDrag2(e, {
          onMouseMove: (_e2, delta) => {
            const currentNote = getEventById(noteId)
            if (currentNote === undefined || !isNoteEvent(currentNote)) {
              return
            }

            // X-axis: change duration
            const tickDelta = transform.getTick(delta.x)
            const rawDuration = initialDuration + tickDelta
            const quantize = isQuantizeEnabled
            const minLength = quantize ? quantizeUnit : 10
            const quantizedDuration = quantize
              ? Math.round(rawDuration / quantizeUnit) * quantizeUnit
              : rawDuration
            const newDuration = Math.max(minLength, quantizedDuration)

            // Y-axis: change velocity (drag up = louder, drag down = softer)
            const velocityDelta = Math.round(
              -delta.y / VELOCITY_PIXELS_PER_UNIT,
            )
            const newVelocity = Math.max(
              1,
              Math.min(127, initialVelocity + velocityDelta),
            )

            updateEvent(noteId, {
              duration: newDuration,
              velocity: newVelocity,
            })

            setLastNoteDuration(newDuration)
            setNewNoteVelocity(newVelocity)

            // Replay note when velocity change crosses threshold
            if (
              Math.abs(newVelocity - lastPreviewedVelocity) >=
              VELOCITY_REPLAY_THRESHOLD
            ) {
              previewNoteOff()
              previewNoteOn(currentNote.noteNumber, undefined, newVelocity)
              lastPreviewedVelocity = newVelocity
            }
          },
          onMouseUp: () => {
            previewNoteOff()
          },
        })
      },
      [
        transform,
        getEventById,
        updateEvent,
        isQuantizeEnabled,
        quantizeUnit,
        setLastNoteDuration,
        setNewNoteVelocity,
        previewNoteOn,
        previewNoteOff,
      ],
    ),
  }
}
