import { TrackTempoEditor } from "../TrackTempoEditor"

export type TempoEditorMutator<R = void> = (editor: TrackTempoEditor) => R
