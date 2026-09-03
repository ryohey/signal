import { TrackControlEditor } from "../TrackControlEditor"

export type ControlEditorMutator<R = void> = (editor: TrackControlEditor) => R
