import type { Track } from "@signal-app/core"
import {
  createOrUpdateItem,
  duplicateItems,
  moveItems,
  pasteItemsAtPosition,
  removeItems,
  removeRedundantItems,
  setBpm,
  type TempoEditorMutator,
  updateItemsInRange,
} from "./mutations"
import {
  getEventIdsInRange,
  getItemsByIds,
  getItemsClipboardData,
  type TempoEditorQuery,
} from "./queries"
import { TrackTempoEditor } from "./TrackTempoEditor"

export const createTempoEditor = (conductorTrack: Track) => {
  const editor = new TrackTempoEditor(conductorTrack)

  const bindQuery =
    <A extends unknown[], R>(
      fn: (...args: A) => TempoEditorQuery<R>,
    ): ((...args: A) => R) =>
    (...args: A) =>
      fn(...args)(editor)

  // Each mutation runs in a transaction so a composed mutation that touches
  // many items emits one change notification instead of one per item.
  const bindMutation =
    <A extends unknown[], R>(
      fn: (...args: A) => TempoEditorMutator<R>,
    ): ((...args: A) => R) =>
    (...args: A) =>
      conductorTrack.transaction(() => fn(...args)(editor))

  return {
    observeItems: editor.observeItems,

    // queries

    listItems: editor.getItems,
    getItemsByIds: bindQuery(getItemsByIds),
    getEventIdsInRange: bindQuery(getEventIdsInRange),
    getItemsClipboardData: bindQuery(getItemsClipboardData),

    // mutations

    removeItems: bindMutation(removeItems),
    duplicateItems: bindMutation(duplicateItems),
    pasteItemsAtPosition: bindMutation(pasteItemsAtPosition),
    moveItems: bindMutation(moveItems),
    removeRedundantItems: bindMutation(removeRedundantItems),
    createOrUpdateItem: bindMutation(createOrUpdateItem),
    updateItemsInRange: bindMutation(updateItemsInRange),
    setBpm: bindMutation(setBpm),
  }
}
