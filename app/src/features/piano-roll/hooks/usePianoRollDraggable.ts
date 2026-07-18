import {
  dragNote,
  getDraggableArea,
  getDraggablePosition,
  getNotesByIds,
  Range,
} from "@signal-app/core"
import { max, min } from "lodash"
import { useCallback } from "react"
import { MaxNoteNumber } from "../../../Constants"
import { NotePoint } from "../entities/NotePoint"
import { Selection } from "../entities/Selection"
import { usePianoRoll } from "./usePianoRoll"

export type DraggableArea = {
  tickRange?: Range
  noteNumberRange?: Range
}

export type PianoRollDraggable =
  | {
      type: "selection"
      position: "center" | "left" | "right"
    }
  | {
      type: "note"
      position: "center" | "left" | "right"
      noteId: number
    }

export function usePianoRollDraggable() {
  const { getSelection, getSelectedTrack, getSelectedNoteIds, setSelection } =
    usePianoRoll()

  const updateDraggable = useCallback(
    (draggable: PianoRollDraggable, position: Partial<NotePoint>) => {
      const selection = getSelection()
      const selectedTrack = getSelectedTrack()

      switch (draggable.type) {
        case "note": {
          return selectedTrack?.mutate(
            dragNote(position, draggable.noteId, draggable.position),
          )
        }
        case "selection": {
          if (selection === null) {
            return
          }
          switch (draggable.position) {
            case "center": {
              const from = Selection.getFrom(selection)
              const defaultedPosition = { ...from, ...position }
              const delta = NotePoint.sub(defaultedPosition, from)
              setSelection(
                Selection.moved(selection, delta.tick, delta.noteNumber),
              )
              break
            }
            case "left": {
              if (position.tick === undefined) {
                return
              }
              setSelection({
                ...selection,
                fromTick: position.tick,
              })
              break
            }
            case "right": {
              if (position.tick === undefined) {
                return
              }
              setSelection({
                ...selection,
                toTick: position.tick,
              })
              break
            }
          }
          break
        }
      }
    },
    [getSelection, getSelectedTrack, setSelection],
  )

  return {
    getDraggablePosition: useCallback(
      (draggable: PianoRollDraggable): NotePoint | null => {
        const selection = getSelection()
        const selectedTrack = getSelectedTrack()

        switch (draggable.type) {
          case "note": {
            return (
              selectedTrack?.query(
                getDraggablePosition(draggable.noteId, draggable.position),
              ) ?? null
            )
          }
          case "selection": {
            if (selection === null) {
              return null
            }
            switch (draggable.position) {
              case "center":
                return Selection.getFrom(selection)
              case "left":
                return Selection.getFrom(selection)
              case "right":
                return Selection.getTo(selection)
            }
          }
        }
      },
      [getSelectedTrack, getSelection],
    ),
    updateDraggables: useCallback(
      (updates: { draggable: PianoRollDraggable; position: NotePoint }[]) => {
        const selectedTrack = getSelectedTrack()
        return selectedTrack?.transaction(() =>
          updates.map(({ draggable, position }) =>
            updateDraggable(draggable, position),
          ),
        )
      },
      [updateDraggable, getSelectedTrack],
    ),
    getDraggableArea: useCallback(
      (
        draggable: PianoRollDraggable,
        minLength: number = 0,
      ): DraggableArea | null => {
        const selectedNoteIds = getSelectedNoteIds()
        const selectedTrack = getSelectedTrack()

        if (selectedTrack === undefined) {
          return null
        }
        switch (draggable.type) {
          case "note":
            return selectedTrack.query(
              getDraggableArea(
                draggable.noteId,
                selectedNoteIds,
                draggable.position,
                minLength,
              ),
            )
          case "selection": {
            const selection = getSelection()
            const selectedNoteIds = getSelectedNoteIds()

            if (selection === null) {
              return null
            }
            const notes = selectedTrack.query(getNotesByIds(selectedNoteIds))
            const minTick = min(notes.map((n) => n.tick)) ?? 0
            // The length of the note that protrudes from the left end of the selection
            const tickOffset = selection.fromTick - minTick
            switch (draggable.position) {
              case "center": {
                const height = selection.fromNoteNumber - selection.toNoteNumber
                return {
                  tickRange: Range.create(tickOffset, Infinity),
                  noteNumberRange: Range.create(height - 1, MaxNoteNumber + 1),
                }
              }
              case "left": {
                // Limit the movement of the left end of the selection
                // - Within the screen range
                // - Make sure that the longest note is not shorter than minLength
                // - Do not move up and down
                // - Do not exceed the right edge
                // - Make sure the selection is at least minLength
                const maxDuration = max(notes.map((n) => n.duration)) ?? 0
                const selectionSmallestLeft = selection.toTick - minLength
                const noteSmallestLeft =
                  selection.fromTick + (maxDuration - minLength)
                return {
                  tickRange: Range.create(
                    tickOffset,
                    Math.min(selectionSmallestLeft, noteSmallestLeft),
                  ),
                  noteNumberRange: Range.point(selection.fromNoteNumber), // allow to move only vertically
                }
              }
              case "right": {
                // Limit the movement of the right end of the selection
                // - Within the screen range
                // - Make sure that the longest note is not shorter than minLength
                // - Do not move up and down
                // - Do not exceed the left edge
                // - Make sure the selection is at least minLength
                const maxDuration = max(notes.map((n) => n.duration)) ?? 0
                const selectionSmallestRight = selection.fromTick + minLength
                const noteSmallestRight =
                  selection.toTick - (maxDuration - minLength)
                return {
                  tickRange: Range.create(
                    Math.max(selectionSmallestRight, noteSmallestRight),
                    Infinity,
                  ),
                  noteNumberRange: Range.point(selection.fromNoteNumber), // allow to move only vertically
                }
              }
            }
          }
        }
      },
      [getSelection, getSelectedNoteIds, getSelectedTrack],
    ),
  }
}
