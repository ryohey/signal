import { isNoteEvent } from "@signal-app/core"
import { useSelectNote } from "../../../../actions"
import type { MouseGesture } from "../../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { usePreviewNote } from "../../../../hooks/usePreviewNote"
import { useTrack } from "../../../../hooks/useTrack"
import { useMoveDraggableGesture } from "./useMoveDraggableGesture"

const createUseDragNoteEdgeGesture =
  (edge: "left" | "right" | "center") => (): MouseGesture<[number]> => {
    const { selectedTrackId, selectedNoteIds, setLastNoteDuration } =
      usePianoRoll()
    const { channel, getEventById } = useTrack(selectedTrackId)
    const selectNote = useSelectNote()
    const moveDraggableAction = useMoveDraggableGesture()
    const { previewNoteOn, previewNoteOff } = usePreviewNote()

    return {
      onMouseDown(e, noteId) {
        if (channel === undefined) {
          return
        }

        const note = getEventById(noteId)
        if (note === undefined || !isNoteEvent(note)) {
          return
        }

        const isSelected = selectedNoteIds.includes(noteId)

        if (!isSelected) {
          selectNote(noteId)
        }

        const newSelectedNoteIds = isSelected ? selectedNoteIds : [noteId]

        previewNoteOn(note.noteNumber)

        moveDraggableAction.onMouseDown(
          e,
          { type: "note", position: edge, noteId },
          newSelectedNoteIds
            .filter((id) => id !== noteId)
            .map((noteId) => ({
              type: "note",
              position: edge,
              noteId,
            })),
          {
            onChange(_e, { oldPosition, newPosition }) {
              const newNote = getEventById(noteId)
              if (newNote === undefined || !isNoteEvent(newNote)) {
                return
              }
              // save last note duration
              if (oldPosition.tick !== newPosition.tick) {
                setLastNoteDuration(newNote.duration)
              }
              if (oldPosition.noteNumber !== newPosition.noteNumber) {
                previewNoteOff()
                previewNoteOn(newNote.noteNumber)
              }
            },
            onMouseUp() {
              previewNoteOff()
            },
            onClick(e) {
              if (!e.shiftKey) {
                selectNote(noteId)
              }
            },
          }
        )
      },
    }
  }

export const useDragNoteLeftGesture = createUseDragNoteEdgeGesture("left")
export const useDragNoteRightGesture = createUseDragNoteEdgeGesture("right")
export const useDragNoteCenterGesture = createUseDragNoteEdgeGesture("center")
