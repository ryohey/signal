import { MaxNoteNumber } from "../../helpers/constants"

export type NoteNumber = number

export namespace NoteNumber {
  export const clamp = (noteNumber: number) =>
    Math.min(MaxNoteNumber, Math.max(0, noteNumber))

  export const isValid = (noteNumber: number) =>
    noteNumber >= 0 && noteNumber <= MaxNoteNumber
}