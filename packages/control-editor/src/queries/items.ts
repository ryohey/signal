import { isEventInRange, isNotUndefined, type Range } from "@signal-app/core"
import { maxBy, min } from "lodash"
import type { ControlItem } from "../entities/ControlItem"
import type { ClipboardData } from "../entities/clipboardTypes"
import type { ControlEditorQuery } from "./type"

export const getItemsByIds =
  (ids: readonly number[]): ControlEditorQuery<readonly ControlItem[]> =>
  (editor) =>
    ids.map((id) => editor.getById(id)).filter(isNotUndefined)

export const getItemsClipboardData =
  (ids: readonly number[]): ControlEditorQuery<ClipboardData | null> =>
  (editor) => {
    const items = getItemsByIds(ids)(editor)
    const minTick = min(items.map((item) => item.tick))

    if (minTick === undefined) {
      return null
    }

    return {
      type: "control_events",
      valueEventType: editor.type,
      events: items.map((item) => ({ ...item, tick: item.tick - minTick })),
    }
  }

export const getItemsInRangeWithPrevious =
  (tickRange: Range): ControlEditorQuery<readonly ControlItem[]> =>
  (editor) => {
    const [tickStart] = tickRange
    const items = editor.getItems()

    const itemsInRange = items.filter(isEventInRange(tickRange))
    const prevItem = maxBy(
      items.filter((item) => item.tick < tickStart),
      (item) => item.tick,
    )

    return prevItem ? [prevItem, ...itemsInRange] : itemsInRange
  }
