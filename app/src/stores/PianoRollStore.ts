import { Player } from "@signal-app/player"
import { Range } from "../entities/geometry/Range"
import { Rect } from "../entities/geometry/Rect"
import QuantizerStore from "./QuantizerStore"
import { SongStore } from "./SongStore"

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

export default class PianoRollStore {
  readonly quantizerStore: QuantizerStore

  constructor(
    private readonly songStore: SongStore,
    private readonly player: Player,
  ) {
    this.quantizerStore = new QuantizerStore(this.songStore, 8)
  }
}
