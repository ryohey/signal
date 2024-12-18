import { useSelectNote, useStartNote, useStopNote } from "../../../../actions"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { useStores } from "../../../../hooks/useStores"
import { isNoteEvent } from "../../../../track"
import { useMoveDraggableGesture } from "./useMoveDraggableGesture"

const useDragNoteEdgeGesture =
  (edge: "left" | "right" | "center") => (): MouseGesture<[number]> => {
    const {
      pianoRollStore,
      pianoRollStore: { selectedTrack, selectedNoteIds },
    } = useStores()
    const selectNote = useSelectNote()
    const startNote = useStartNote()
    const stopNote = useStopNote()
    const moveDraggableAction = useMoveDraggableGesture()

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

        const newSelectedNoteIds = pianoRollStore.selectedNoteIds

        const { channel } = selectedTrack
        startNote({ ...note, channel })
        let playingNoteNumber = note.noteNumber

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
                pianoRollStore.lastNoteDuration = newNote.duration
              }
              if (
                oldPosition.noteNumber !== newPosition.noteNumber &&
                newNote.noteNumber !== playingNoteNumber
              ) {
                stopNote({ noteNumber: playingNoteNumber, channel })
                startNote({
                  noteNumber: newNote.noteNumber,
                  channel,
                  velocity: newNote.velocity,
                })
                playingNoteNumber = newNote.noteNumber
              }
            },
            onMouseUp() {
              stopNote({ noteNumber: playingNoteNumber, channel })
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
