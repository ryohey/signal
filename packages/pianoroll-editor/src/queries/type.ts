import type { NoteEvent } from "../entities"

export interface PianoRollQueryContext {
  getNoteById: (id: number) => NoteEvent | undefined
  getAllNotes: () => readonly NoteEvent[]
}

export type PianoRollEditorQuery<R> = (context: PianoRollQueryContext) => R
