import { NoteEvent, NoteNumber } from "@signal-app/core"
import { useCallback } from "react"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useHistory } from "../../../../hooks/useHistory"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { usePreviewNote } from "../../../../hooks/usePreviewNote"
import { useQuantizer } from "../../../../hooks/useQuantizer"
import { useSong } from "../../../../hooks/useSong"
import { useTrack } from "../../../../hooks/useTrack"

// Pixels of Y-axis drag needed to change velocity by 1
const VELOCITY_PIXELS_PER_UNIT = 1.5
// Velocity change needed to retrigger note preview
const VELOCITY_REPLAY_THRESHOLD = 10

export const useCreateNoteGesture = (): MouseGesture => {
  const {
    transform,
    selectedTrackId,
    newNoteVelocity,
    lastNoteDuration,
    getLocal,
    setNewNoteVelocity,
    setLastNoteDuration,
  } = usePianoRoll()
  const { quantizeRound, quantizeFloor, quantizeUnit, isQuantizeEnabled } =
    useQuantizer()
  const { channel, isRhythmTrack, addEvent, updateEvent } =
    useTrack(selectedTrackId)
  const { timebase } = useSong()
  const { pushHistory } = useHistory()
  const { previewNoteOn, previewNoteOff } = usePreviewNote()

  return {
    onMouseDown: useCallback(
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

        const initialDuration = isRhythmTrack
          ? timebase / 8 // 32th note in the rhythm track
          : (lastNoteDuration ?? quantizeUnit)

        const note = addEvent({
          type: "channel",
          subtype: "note",
          noteNumber: noteNumber,
          tick: quantizedTick,
          velocity: newNoteVelocity,
          duration: initialDuration,
        } as NoteEvent)

        if (note === undefined) {
          return
        }

        // Preview the note at current velocity
        previewNoteOn(noteNumber, undefined, newNoteVelocity)

        let currentVelocity = newNoteVelocity
        let lastPreviewedVelocity = newNoteVelocity
        let currentDuration = initialDuration

        observeDrag2(e, {
          onMouseMove: (_e, delta) => {
            // X-axis: adjust duration at quantization grid
            const quantize = !_e.shiftKey && isQuantizeEnabled
            const tickDelta = transform.getTick(delta.x)
            const minDuration = quantize ? quantizeUnit : 10
            let newDuration = Math.max(minDuration, initialDuration + tickDelta)
            if (quantize) {
              // Snap duration to grid: quantizedTick + snapped duration
              const endTick = quantizeRound(quantizedTick + newDuration)
              newDuration = Math.max(minDuration, endTick - quantizedTick)
            }

            if (newDuration !== currentDuration) {
              currentDuration = newDuration
              updateEvent(note.id, { duration: currentDuration })
              setLastNoteDuration(currentDuration)
            }

            // Y-axis: adjust velocity (dragging up = louder, down = softer)
            const velocityDelta = Math.round(
              -delta.y / VELOCITY_PIXELS_PER_UNIT,
            )
            const newVelocity = Math.max(
              1,
              Math.min(127, newNoteVelocity + velocityDelta),
            )

            if (newVelocity !== currentVelocity) {
              currentVelocity = newVelocity
              updateEvent(note.id, { velocity: currentVelocity })

              // Replay note preview when velocity changes enough
              if (
                Math.abs(currentVelocity - lastPreviewedVelocity) >=
                VELOCITY_REPLAY_THRESHOLD
              ) {
                lastPreviewedVelocity = currentVelocity
                previewNoteOn(noteNumber, undefined, currentVelocity)
              }
            }
          },
          onMouseUp: () => {
            previewNoteOff()
            // Persist the final velocity for next note creation
            setNewNoteVelocity(currentVelocity)
          },
        })
      },
      [
        transform,
        getLocal,
        channel,
        isRhythmTrack,
        isQuantizeEnabled,
        quantizeRound,
        quantizeFloor,
        quantizeUnit,
        timebase,
        newNoteVelocity,
        lastNoteDuration,
        addEvent,
        updateEvent,
        pushHistory,
        previewNoteOn,
        previewNoteOff,
        setNewNoteVelocity,
        setLastNoteDuration,
      ],
    ),
  }
}
