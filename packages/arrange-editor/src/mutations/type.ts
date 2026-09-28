import type { SongArrangeEditor } from "../SongArrangeEditor"

export type ArrangeEditorMutator<R = void> = (editor: SongArrangeEditor) => R
