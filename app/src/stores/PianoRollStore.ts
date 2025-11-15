import { Range } from "../entities/geometry/Range"
import { Rect } from "../entities/geometry/Rect"

export type PianoRollMouseMode = "pencil" | "selection"

export type PianoNoteItem = Rect & {
  id: number
  velocity: number
  noteNumber: number
  isSelected: boolean
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

export type DraggableArea = {
  tickRange?: Range
  noteNumberRange?: Range
}
