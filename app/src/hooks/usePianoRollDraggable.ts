import { max, min } from "lodash"
import { useCallback } from "react"
import { MaxNoteNumber } from "../Constants"
import { Range } from "../entities/geometry/Range"
import { Selection } from "../entities/selection/Selection"
import { NotePoint } from "../entities/transform/NotePoint"
import { isNotUndefined } from "../helpers/array"
import { DraggableArea, PianoRollDraggable } from "../stores/PianoRollStore"
import { isNoteEvent } from "../track"
import { usePianoRoll } from "./usePianoRoll"

export function usePianoRollDraggable() {
  const { getSelection, getSelectedTrack, getSelectedNoteIds, setSelection } =
    usePianoRoll()

  return {
    getDraggablePosition: useCallback(
      (draggable: PianoRollDraggable): NotePoint | null => {
        const selection = getSelection()
        const selectedTrack = getSelectedTrack()

        switch (draggable.type) {
          case "note": {
            if (selectedTrack === undefined) {
              return null
            }
            const note = selectedTrack.getEventById(draggable.noteId)
            if (note === undefined || !isNoteEvent(note)) {
              return null
            }
            switch (draggable.position) {
              case "center":
                return note
              case "left":
                return note
              case "right":
                return {
                  tick: note.tick + note.duration,
                  noteNumber: note.noteNumber,
                }
            }
            break
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
            break
          }
        }
      },
      [getSelectedTrack, getSelection],
    ),
    updateDraggable: useCallback(
      (draggable: PianoRollDraggable, position: Partial<NotePoint>) => {
        const selection = getSelection()
        const selectedTrack = getSelectedTrack()

        switch (draggable.type) {
          case "note": {
            if (selectedTrack === undefined) {
              return
            }
            const note = selectedTrack.getEventById(draggable.noteId)
            if (note === undefined || !isNoteEvent(note)) {
              return
            }
            switch (draggable.position) {
              case "center": {
                selectedTrack.updateEvent(note.id, position)
                break
              }
              case "left": {
                if (position.tick === undefined) {
                  return
                }
                selectedTrack.updateEvent(note.id, {
                  tick: position.tick,
                  duration: note.duration + note.tick - position.tick,
                })
                break
              }
              case "right": {
                if (position.tick === undefined) {
                  return
                }
                selectedTrack.updateEvent(note.id, {
                  duration: position.tick - note.tick,
                })
                break
              }
            }
            break
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
          case "note": {
            const note = selectedTrack.getEventById(draggable.noteId)
            if (note === undefined || !isNoteEvent(note)) {
              return null
            }
            const notes = selectedNoteIds
              .map((id) => selectedTrack.getEventById(id))
              .filter(isNotUndefined)
              .filter(isNoteEvent)
            const minTick = min(notes.map((n) => n.tick)) ?? 0
            const tickLowerBound = note.tick - minTick
            switch (draggable.position) {
              case "center": {
                const maxNoteNumber = max(notes.map((n) => n.noteNumber)) ?? 0
                const minNoteNumber = min(notes.map((n) => n.noteNumber)) ?? 0
                const noteNumberLowerBound = note.noteNumber - minNoteNumber
                const noteNumberUpperBound =
                  MaxNoteNumber - (maxNoteNumber - note.noteNumber)
                return {
                  tickRange: Range.create(tickLowerBound, Infinity),
                  noteNumberRange: Range.create(
                    noteNumberLowerBound,
                    noteNumberUpperBound,
                  ),
                }
              }
              case "left":
                return {
                  tickRange: Range.create(
                    tickLowerBound,
                    note.tick + note.duration - minLength,
                  ),
                  noteNumberRange: Range.point(note.noteNumber), // allow to move only vertically
                }
              case "right":
                return {
                  tickRange: Range.create(note.tick + minLength, Infinity),
                  noteNumberRange: Range.point(note.noteNumber), // allow to move only vertically
                }
            }
            break
          }
          case "selection": {
            const selection = getSelection()
            const selectedNoteIds = getSelectedNoteIds()

            if (selection === null) {
              return null
            }
            const notes = selectedNoteIds
              .map((id) => selectedTrack.getEventById(id))
              .filter(isNotUndefined)
              .filter(isNoteEvent)
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
