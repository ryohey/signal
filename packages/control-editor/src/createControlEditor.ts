import type { Track } from "@signal-app/core"
import type { ControlItem } from "./entities/ControlItem"
import type { ValueEventType } from "./entities/ValueEventType"
import {
  type ControlEditorMutator,
  createOrUpdateItemValue,
  duplicateItems,
  moveItems,
  pasteItemsAtPosition,
  removeItems,
  removeRedundantItems,
  updateItemsInRange,
  updateItemsInRangeWithEasing,
} from "./mutations"
import {
  type ControlEditorQuery,
  getItemsByIds,
  getItemsClipboardData,
  getItemsInRangeWithPrevious,
} from "./queries"
import { TrackControlEditor } from "./TrackControlEditor"

export const createControlEditor = (track: Track, type: ValueEventType) => {
  const editor = new TrackControlEditor(track, type)

  const bindQuery =
    <A extends unknown[], R>(
      fn: (...args: A) => ControlEditorQuery<R>,
    ): ((...args: A) => R) =>
    (...args: A) =>
      fn(...args)(editor)

  // Each mutation runs in a transaction so a composed mutation that touches
  // many items emits one change notification instead of one per item.
  const bindMutation =
    <A extends unknown[], R>(
      fn: (...args: A) => ControlEditorMutator<R>,
    ): ((...args: A) => R) =>
    (...args: A) =>
      track.transaction(() => fn(...args)(editor))

  return {
    type: editor.type,
    observeItems: editor.observeItems,
    createPreviewEvent: editor.createPreviewEvent,

    // queries

    getItemsByIds: bindQuery(getItemsByIds),
    getItemsClipboardData: bindQuery(getItemsClipboardData),
    getItemsInRangeWithPrevious: bindQuery(getItemsInRangeWithPrevious),

    // mutations

    addItem: (item: Omit<ControlItem, "id">) =>
      track.transaction(() => editor.addItem(item)),
    removeItems: bindMutation(removeItems),
    createOrUpdateItemValue: bindMutation(createOrUpdateItemValue),
    updateItemsInRange: bindMutation(updateItemsInRange),
    updateItemsInRangeWithEasing: bindMutation(updateItemsInRangeWithEasing),
    pasteItemsAtPosition: bindMutation(pasteItemsAtPosition),
    duplicateItems: bindMutation(duplicateItems),
    removeRedundantItems: bindMutation(removeRedundantItems),
    moveItems: bindMutation(moveItems),
  }
}
