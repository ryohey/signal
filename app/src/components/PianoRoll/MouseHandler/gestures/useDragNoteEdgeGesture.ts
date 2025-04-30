import { useSelectNote } from "../../../../actions"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { usePreviewNote } from "../../../../hooks/usePreviewNote"
import { isNoteEvent } from "../../../../track"
import { useMoveDraggableGesture } from "./useMoveDraggableGesture"

const useDragNoteEdgeGesture =
  (edge: "left" | "right" | "center") => (): MouseGesture<[number]> => {
    const { selectedTrack, selectedNoteIds, setLastNoteDuration } =
      usePianoRoll()
    const selectNote = useSelectNote()
    const moveDraggableAction = useMoveDraggableGesture()
    const { previewNoteOn, previewNoteOff } = usePreviewNote()

    return {
      onMouseDown(e, noteId) {
        if (
          selectedTrack === undefined ||
          selectedTrack.channel === undefined
        ) {
          return
        }

        const note = selectedTrack.getEventById(noteId)
        if (note == undefined || !isNoteEvent(note)) {
          return
        }

        const isSelected = selectedNoteIds.includes(noteId)

        if (!isSelected) {
          selectNote(noteId)
        }

        const newSelectedNoteIds = selectedNoteIds

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
              const newNote = selectedTrack.getEventById(noteId)
              if (newNote == undefined || !isNoteEvent(newNote)) {
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
          },
        )
      },
    }
  }

export const useDragNoteLeftGesture = useDragNoteEdgeGesture("left")
export const useDragNoteRightGesture = useDragNoteEdgeGesture("right")
export const useDragNoteCenterGesture = useDragNoteEdgeGesture("center")
