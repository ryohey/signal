import { closedRange, interpolate, Range } from "@signal-app/core"
import { max, min } from "lodash"
import type { ControlItem } from "../entities/ControlItem"
import type { ClipboardData } from "../entities/clipboardTypes"
import { moveControlItem } from "../entities/transform"
import { ValueEventType } from "../entities/ValueEventType"
import { getItemsByIds } from "../queries/items"
import type { ControlEditorMutator } from "./type"

export const removeItems =
  (ids: readonly number[]): ControlEditorMutator<void> =>
  (editor) => {
    ids.forEach((id) => editor.removeItem(id))
  }

export const moveItems =
  (
    ids: readonly number[],
    deltaTick: number,
    deltaValue: number,
    maxValue: number,
  ): ControlEditorMutator<void> =>
  (editor) => {
    const items = getItemsByIds(ids)(editor)
    items
      .map(moveControlItem(deltaTick, deltaValue, maxValue))
      .forEach((item) => editor.updateItem(item))
  }

export const removeRedundantItems =
  (ids: readonly number[]): ControlEditorMutator<void> =>
  (editor) => {
    const sourceIdByTick = new Map<number, number>()
    getItemsByIds(ids)(editor).forEach((item) => {
      if (!sourceIdByTick.has(item.tick)) {
        sourceIdByTick.set(item.tick, item.id)
      }
    })

    const idsToRemove = editor.getItems().flatMap((item) => {
      const sourceId = sourceIdByTick.get(item.tick)
      return sourceId === undefined || sourceId === item.id ? [] : [item.id]
    })
    idsToRemove.forEach((id) => editor.removeItem(id))
  }

export const duplicateItems =
  (ids: readonly number[]): ControlEditorMutator<readonly number[]> =>
  (editor) => {
    const selected = getItemsByIds(ids)(editor)

    const deltaTick =
      selected.length === 0
        ? 0
        : (max(selected.map((item) => item.tick)) ?? 0) -
          (min(selected.map((item) => item.tick)) ?? 0)

    return selected
      .map((item) =>
        editor.addItem({
          tick: Math.max(0, Math.floor(item.tick + deltaTick)),
          value: item.value,
        }),
      )
      .filter((item): item is ControlItem => item !== undefined)
      .map((item) => item.id)
  }

export const createOrUpdateItemValue =
  (
    selectedItemIds: readonly number[],
    value: number,
    tick: number,
  ): ControlEditorMutator<void> =>
  (editor) => {
    const items = getItemsByIds(selectedItemIds)(editor)

    if (items.length > 0) {
      items.forEach((item) => editor.updateItem({ ...item, value }))
    } else {
      editor.addItem({ tick: Math.max(0, Math.floor(tick)), value })
    }
  }

export const updateItemsInRangeWithEasing =
  (
    valueRange: Range,
    tickRange: Range,
    quantizeFloor: (tick: number) => number,
    quantizeUnit: number,
    easing: (t: number) => number,
  ): ControlEditorMutator<void> =>
  (editor) => {
    // valueRange and tickRange describe a drag from (tickRange[0],
    // valueRange[0]) to (tickRange[1], valueRange[1]), so they may be
    // descending. Only the ticks need ordering for quantization.
    const fromTick = tickRange[0]
    const [startTick, endTick] = Range.fromUnordered(...tickRange)
    const quantizedStartTick = quantizeFloor(Math.max(0, startTick))
    const quantizedEndTick = quantizeFloor(Math.max(0, endTick))

    const getValue = interpolate(valueRange, tickRange, easing)

    const updateStartTick = Math.min(startTick, quantizedStartTick)
    const updateEndTick = Math.max(endTick, quantizedEndTick)

    const idsToRemove = editor
      .getItems()
      .filter(
        (item) =>
          item.tick !== fromTick &&
          item.tick >= updateStartTick &&
          item.tick <= updateEndTick,
      )
      .map((item) => item.id)
    idsToRemove.forEach((id) => editor.removeItem(id))

    closedRange(quantizedStartTick, quantizedEndTick, quantizeUnit).forEach(
      (tick) => {
        editor.addItem({ tick, value: getValue(tick) })
      },
    )
  }

export const updateItemsInRange = (
  valueRange: Range,
  tickRange: Range,
  quantizeFloor: (tick: number) => number,
  quantizeUnit: number,
): ControlEditorMutator<void> =>
  updateItemsInRangeWithEasing(
    valueRange,
    tickRange,
    quantizeFloor,
    quantizeUnit,
    (t) => t,
  )

export const pasteItemsAtPosition =
  (data: ClipboardData, position: number): ControlEditorMutator<void> =>
  (editor) => {
    // pitchBend and controller values live in different ranges (and
    // different controllers mean different things), so refuse to paste
    // data copied from a different ValueEventType.
    if (!ValueEventType.equals(data.valueEventType, editor.type)) {
      return
    }

    data.events.forEach((item) => {
      editor.addItem({
        tick: Math.max(0, item.tick + position),
        value: item.value,
      })
    })
  }
