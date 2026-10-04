import type { Song } from "@signal-app/core"
import {
  type ArrangeEditorMutator,
  batchUpdateSelectionVelocity,
  duplicateSelection,
  moveEvents,
  pasteEventsAt,
  removeSelection,
  transposeSelection,
} from "./mutations"
import {
  type ArrangeEditorQuery,
  getEventIdsInSelection,
  getEventsClipboardData,
  hasEventsInSelection,
} from "./queries"
import { SongArrangeEditor } from "./SongArrangeEditor"

export const createArrangeEditor = (song: Song) => {
  const editor = new SongArrangeEditor(song)

  const bindQuery =
    <A extends unknown[], R>(
      fn: (...args: A) => ArrangeEditorQuery<R>,
    ): ((...args: A) => R) =>
    (...args: A) =>
      fn(...args)(editor)

  // Each mutation runs inside a transaction spanning every track, so a
  // composed mutation that touches many events emits one change
  // notification instead of one per event.
  const bindMutation =
    <A extends unknown[], R>(
      fn: (...args: A) => ArrangeEditorMutator<R>,
    ): ((...args: A) => R) =>
    (...args: A) =>
      editor.transaction(() => fn(...args)(editor))

  return {
    observeItems: editor.observeItems,
    observeTrackCount: editor.observeTrackCount,

    // queries

    getTrackCount: () => editor.trackCount,
    listNotes: editor.getArrangeNotes,
    getEventIdsInSelection: bindQuery(getEventIdsInSelection),
    hasEventsInSelection: bindQuery(hasEventsInSelection),
    getEventsClipboardData: bindQuery(getEventsClipboardData),

    // mutations

    moveEvents: bindMutation(moveEvents),
    duplicateSelection: bindMutation(duplicateSelection),
    removeSelection: bindMutation(removeSelection),
    transposeSelection: bindMutation(transposeSelection),
    batchUpdateSelectionVelocity: bindMutation(batchUpdateSelectionVelocity),
    pasteEventsAt: bindMutation(pasteEventsAt),
  }
}
