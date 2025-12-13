import { clamp } from "lodash"
import { MaxNoteNumber } from "../../Constants"
import type { Rect } from "../geometry/Rect"
import type { NoteCoordTransform } from "../transform/NoteCoordTransform"
import type { NotePoint } from "../transform/NotePoint"

export interface Selection {
  readonly fromTick: number
  readonly fromNoteNumber: number
  readonly toTick: number
  readonly toNoteNumber: number
}

export namespace Selection {
  export const getBounds = (
    selection: Selection,
    transform: NoteCoordTransform
  ): Rect => {
    const left = transform.getX(selection.fromTick)
    const right = transform.getX(selection.toTick)
    const top = transform.getY(selection.fromNoteNumber)
    const bottom = transform.getY(selection.toNoteNumber)
    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    }
  }

  export const moved = (
    selection: Selection,
    dt: number,
    dn: number
  ): Selection => {
    return {
      fromTick: selection.fromTick + dt,
      fromNoteNumber: selection.fromNoteNumber + dn,
      toTick: selection.toTick + dt,
      toNoteNumber: selection.toNoteNumber + dn,
    }
  }

  export function fromPoints(start: NotePoint, end: NotePoint) {
    const leftTick = Math.min(start.tick, end.tick)
    const rightTick = Math.max(start.tick, end.tick)

    // integer containing the original coordinates.
    const topNoteNumber = Math.ceil(Math.max(start.noteNumber, end.noteNumber))
    const bottomNoteNumber = Math.floor(
      Math.min(start.noteNumber, end.noteNumber)
    )

    return {
      fromTick: Math.max(0, leftTick),
      fromNoteNumber: clamp(topNoteNumber, -1, MaxNoteNumber),
      toTick: Math.max(0, rightTick),
      toNoteNumber: clamp(bottomNoteNumber, -1, MaxNoteNumber),
    }
  }

  export function getFrom(selection: Selection): NotePoint {
    return { tick: selection.fromTick, noteNumber: selection.fromNoteNumber }
  }

  export function getTo(selection: Selection): NotePoint {
    return { tick: selection.toTick, noteNumber: selection.toNoteNumber }
  }

  export const isEmpty = (selection: Selection): boolean => {
    return (
      selection.fromTick === selection.toTick ||
      selection.fromNoteNumber === selection.toNoteNumber
    )
  }
}
