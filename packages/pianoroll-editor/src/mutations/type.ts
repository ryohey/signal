import type { NoteEvent } from "../entities"
import type { PianoRollQueryContext } from "../queries"

export interface PianoRollMutationContext extends PianoRollQueryContext {
  addNote: (note: Omit<NoteEvent, "id">) => NoteEvent
  removeNote: (id: number) => void
  updateNote: (note: Partial<NoteEvent> & { id: number }) => NoteEvent
}

export type PianoRollEditorMutator<R = void> = (
  editor: PianoRollMutationContext,
) => R
