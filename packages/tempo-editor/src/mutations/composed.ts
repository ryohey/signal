import { closedRange, interpolate, Range } from "@signal-app/core"
import { max, min } from "lodash"
import type { TempoItem } from "../entities"
import type { ClipboardData } from "../entities/clipboardTypes"
import { moveTempoItem } from "../entities/tempo/transform"
import { getItemsByIds } from "../queries/items"
import type { TempoEditorMutator } from "./type"

const createOrUpdateItems =
  (
    items: readonly Omit<TempoItem, "id">[],
  ): TempoEditorMutator<readonly TempoItem[]> =>
  (editor) => {
    const existingByTick = new Map<number, TempoItem[]>()
    editor.getItems().forEach((item) => {
      const existing = existingByTick.get(item.tick) ?? []
      existing.push(item)
      existingByTick.set(item.tick, existing)
    })

    const updates: TempoItem[] = []
    const additions: Omit<TempoItem, "id">[] = []
    const result: TempoItem[] = []

    items.forEach((item) => {
      const existing = existingByTick.get(item.tick)
      if (existing === undefined) {
        additions.push(item)
        return
      }

      const updated = existing.map((current) => ({ ...current, bpm: item.bpm }))
      updates.push(...updated)
      result.push(updated[0])
    })

    updates.forEach((item) => editor.updateItem(item))
    return [
      ...result,
      ...additions
        .map((item) => editor.addItem(item))
        .filter((item): item is TempoItem => item !== undefined),
    ]
  }

export const removeItems =
  (ids: readonly number[]): TempoEditorMutator<void> =>
  (editor) => {
    ids.forEach((id) => editor.removeItem(id))
  }

export const duplicateItems =
  (ids: readonly number[]): TempoEditorMutator<readonly number[]> =>
  (editor) => {
    const selected = getItemsByIds(ids)(editor)

    const deltaTick =
      selected.length === 0
        ? 0
        : (max(selected.map((item) => item.tick)) ?? 0) -
          (min(selected.map((item) => item.tick)) ?? 0)

    return createOrUpdateItems(
      selected.map((item) => ({
        tick: Math.max(0, Math.floor(item.tick + deltaTick)),
        bpm: item.bpm,
      })),
    )(editor).map((item) => item.id)
  }

export const pasteItemsAtPosition = (
  data: ClipboardData,
  tick: number,
): TempoEditorMutator<void> =>
  createOrUpdateItems(
    data.items.map(({ id: _, ...item }) => ({
      ...item,
      tick: Math.max(0, Math.floor(item.tick + tick)),
    })),
  )

export const moveItems =
  (
    ids: readonly number[],
    deltaTick: number,
    deltaValue: number,
    maxBPM: number,
  ): TempoEditorMutator<void> =>
  (editor) => {
    const updates = getItemsByIds(ids)(editor).map(
      moveTempoItem(deltaTick, deltaValue, maxBPM),
    )
    updates.forEach((item) => editor.updateItem(item))
  }

export const removeRedundantItems =
  (ids: readonly number[]): TempoEditorMutator<void> =>
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

export const createOrUpdateItem = (
  tick: number,
  bpm: number,
): TempoEditorMutator<void> =>
  createOrUpdateItems([{ tick: Math.max(0, Math.floor(tick)), bpm }])

export const updateItemsInRange =
  (
    valueRange: Range,
    tickRange: Range,
    quantizeFloor: (tick: number) => number,
    quantizeUnit: number,
  ): TempoEditorMutator<void> =>
  (editor) => {
    // valueRange and tickRange describe a drag from (tickRange[0],
    // valueRange[0]) to (tickRange[1], valueRange[1]), so they may be
    // descending. Only the ticks need ordering for quantization.
    const fromTick = tickRange[0]
    const [startTick, endTick] = Range.fromUnordered(...tickRange)
    const quantizedStartTick = quantizeFloor(Math.max(0, startTick))
    const quantizedEndTick = quantizeFloor(Math.max(0, endTick))
    const eventUpdateStartTick = Math.min(startTick, quantizedStartTick)
    const eventUpdateEndTick = Math.max(endTick, quantizedEndTick)

    const idsToRemove = editor
      .getItems()
      .flatMap((item) =>
        item.tick === fromTick ||
        item.tick < eventUpdateStartTick ||
        item.tick > eventUpdateEndTick
          ? []
          : [item.id],
      )
    idsToRemove.forEach((id) => editor.removeItem(id))
    const ticks = closedRange(
      quantizedStartTick,
      quantizedEndTick,
      quantizeUnit,
    )
    createOrUpdateItems(
      ticks.map((tick) => ({
        tick,
        bpm: interpolate(valueRange, tickRange)(tick),
      })),
    )(editor)
  }

export const setBpm =
  (id: number, bpm: number): TempoEditorMutator<void> =>
  (editor) => {
    const item = editor.getById(id)
    if (item !== undefined) {
      editor.updateItem({ ...item, bpm })
    }
  }
