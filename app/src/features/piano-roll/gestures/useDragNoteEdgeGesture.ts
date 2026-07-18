import { useCallback } from "react"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { usePreviewNote } from "../../../hooks/usePreviewNote"
import { useTrack } from "../../../hooks/useTrack"
import { useSelectNote } from "../hooks/selection"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { useMoveDraggableGesture } from "./useMoveDraggableGesture"

const createUseDragNoteEdgeGesture =
  (edge: "left" | "right" | "center") =>
  (): MouseDownHandler<[{ id: number; noteNumber: number }]> => {
    const { selectedTrackId, selectedNoteIds, setLastNoteDuration } =
      usePianoRoll()
    const { channel } = useTrack(selectedTrackId)
    const selectNote = useSelectNote()
    const moveDraggableAction = useMoveDraggableGesture()
    const { previewNoteOn, previewNoteOff } = usePreviewNote()

    return useCallback(
      (e, note) => {
        if (channel === undefined) {
          return
        }

        const isSelected = selectedNoteIds.includes(note.id)

        if (!isSelected) {
          selectNote(note.id)
        }

        const newSelectedNoteIds = isSelected ? selectedNoteIds : [note.id]

        previewNoteOn(note.noteNumber)

        moveDraggableAction(
          e,
          { type: "note", position: edge, noteId: note.id },
          newSelectedNoteIds
            .filter((id) => id !== note.id)
            .map((noteId) => ({
              type: "note",
              position: edge,
              noteId,
            })),
          {
            onChange(_e, { oldPosition, newPosition, updatedNotes }) {
              // save last note duration
              if (oldPosition.tick !== newPosition.tick) {
                const newNote = updatedNotes.find((n) => n.id === note.id)
                if (newNote) {
                  setLastNoteDuration(newNote.duration)
                }
              }
              if (oldPosition.noteNumber !== newPosition.noteNumber) {
                previewNoteOff()
                previewNoteOn(newPosition.noteNumber)
              }
            },
            onMouseUp() {
              previewNoteOff()
            },
            onClick(e) {
              if (!e.shiftKey) {
                selectNote(note.id)
              }
            },
          },
        )
      },
      [
        channel,
        selectedNoteIds,
        selectNote,
        previewNoteOn,
        previewNoteOff,
        moveDraggableAction,
        setLastNoteDuration,
      ],
    )
  }

export const useDragNoteLeftGesture = createUseDragNoteEdgeGesture("left")
export const useDragNoteRightGesture = createUseDragNoteEdgeGesture("right")
export const useDragNoteCenterGesture = createUseDragNoteEdgeGesture("center")
