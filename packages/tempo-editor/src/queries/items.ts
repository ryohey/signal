import { Range } from "@signal-app/core"
import { TempoItem } from "../entities"
import { ClipboardData } from "../entities/clipboardTypes"
import { TempoEditorQuery } from "./type"

export const getItemsByIds =
  (ids: readonly number[]): TempoEditorQuery<readonly TempoItem[]> =>
  (editor) =>
    ids
      .map((id) => editor.getById(id))
      .filter((item): item is TempoItem => item !== undefined)

export const getEventIdsInRange =
  (range: Range): TempoEditorQuery<readonly number[]> =>
  (editor) => {
    return editor
      .getItems()
      .filter((item) => Range.contains(range, item.tick))
      .map((item) => item.id)
  }

export const getItemsClipboardData =
  (ids: readonly number[]): TempoEditorQuery<ClipboardData | null> =>
  (editor) => {
    const selected = ids
      .map((id) => editor.getById(id))
      .filter((item): item is TempoItem => item !== undefined)

    if (selected.length === 0) {
      return null
    }

    const minTick = Math.min(...selected.map((item) => item.tick))

    return {
      type: "tempo_events",
      items: selected.map((item) => ({
        ...item,
        tick: item.tick - minTick,
      })),
    }
  }
