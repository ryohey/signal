import { describe, expect, it } from "vitest"
import type { ClipboardData } from "../entities/clipboardTypes"
import { createTrackControlEditor } from "../testUtils"
import {
  createOrUpdateItemValue,
  duplicateItems,
  moveItems,
  pasteItemsAtPosition,
  removeItems,
  removeRedundantItems,
  updateItemsInRange,
  updateItemsInRangeWithEasing,
} from "./composed"

describe("control editor composed mutations", () => {
  it("removeItems removes selected items", () => {
    const editor = createTrackControlEditor()
    const first = editor.addItem({ tick: 10, value: 1 })
    const second = editor.addItem({ tick: 20, value: 2 })

    removeItems([first.id])(editor)

    expect(editor.getItems()).toMatchObject([{ id: second.id }])
  })

  it("moveItems shifts tick and value, clamping the value", () => {
    const editor = createTrackControlEditor()
    const added = editor.addItem({ tick: 10, value: 64 })

    moveItems([added.id], 5, 100, 127)(editor)

    expect(editor.getById(added.id)).toMatchObject({ tick: 15, value: 127 })
  })

  it("removeRedundantItems keeps the source item and removes others at the same tick", () => {
    const editor = createTrackControlEditor()
    const source = editor.addItem({ tick: 10, value: 64 })
    const other = editor.addItem({ tick: 30, value: 100 })
    editor.updateItem({ ...other, tick: 10 })

    removeRedundantItems([source.id])(editor)

    expect(editor.getItems()).toStrictEqual([source])
  })

  it("duplicateItems shifts a copy by the selection's tick span", () => {
    const editor = createTrackControlEditor()
    const first = editor.addItem({ tick: 10, value: 1 })
    const second = editor.addItem({ tick: 30, value: 2 })

    const newIds = duplicateItems([first.id, second.id])(editor)

    const duplicatedTicks = newIds
      .map((id) => editor.getById(id)?.tick)
      .sort((a, b) => (a ?? 0) - (b ?? 0))
    expect(duplicatedTicks).toStrictEqual([30, 50])
  })

  it("createOrUpdateItemValue creates a new item when nothing is selected", () => {
    const editor = createTrackControlEditor()

    createOrUpdateItemValue([], 64, 10)(editor)

    expect(editor.getItems()).toMatchObject([{ tick: 10, value: 64 }])
  })

  it("createOrUpdateItemValue updates every selected item's value", () => {
    const editor = createTrackControlEditor()
    const first = editor.addItem({ tick: 10, value: 1 })
    const second = editor.addItem({ tick: 20, value: 2 })

    createOrUpdateItemValue([first.id, second.id], 100, 999)(editor)

    expect(editor.getItems()).toMatchObject([
      { tick: 10, value: 100 },
      { tick: 20, value: 100 },
    ])
  })

  it("updateItemsInRangeWithEasing replaces the range with an eased curve", () => {
    const editor = createTrackControlEditor()
    const quantizeUnit = 10
    const quantizeFloor = (tick: number) =>
      Math.floor(tick / quantizeUnit) * quantizeUnit

    updateItemsInRangeWithEasing(
      [0, 100],
      [0, 20],
      quantizeFloor,
      quantizeUnit,
      (t) => t * t,
    )(editor)

    const items = editor
      .getItems()
      .map((item) => ({ tick: item.tick, value: item.value }))
      .sort((a, b) => a.tick - b.tick)

    expect(items).toStrictEqual([
      { tick: 0, value: 0 },
      { tick: 10, value: 25 },
      { tick: 20, value: 100 },
    ])
  })

  it("updateItemsInRange replaces the range with a linear ramp", () => {
    const editor = createTrackControlEditor()
    const quantizeUnit = 10
    const quantizeFloor = (tick: number) =>
      Math.floor(tick / quantizeUnit) * quantizeUnit

    updateItemsInRange([0, 100], [0, 20], quantizeFloor, quantizeUnit)(editor)

    const items = editor
      .getItems()
      .map((item) => ({ tick: item.tick, value: item.value }))
      .sort((a, b) => a.tick - b.tick)

    expect(items).toStrictEqual([
      { tick: 0, value: 0 },
      { tick: 10, value: 50 },
      { tick: 20, value: 100 },
    ])
  })

  it("updateItemsInRangeWithEasing keeps the drag direction when drawn right to left", () => {
    const editor = createTrackControlEditor()
    const quantizeUnit = 10
    const quantizeFloor = (tick: number) =>
      Math.floor(tick / quantizeUnit) * quantizeUnit

    // Drag from (tick 20, value 100) to (tick 0, value 0)
    updateItemsInRangeWithEasing(
      [100, 0],
      [20, 0],
      quantizeFloor,
      quantizeUnit,
      (t) => t * t,
    )(editor)

    const items = editor
      .getItems()
      .map((item) => ({ tick: item.tick, value: item.value }))
      .sort((a, b) => a.tick - b.tick)

    expect(items).toStrictEqual([
      { tick: 0, value: 0 },
      { tick: 10, value: 75 },
      { tick: 20, value: 100 },
    ])
  })

  it("updateItemsInRange draws a descending ramp", () => {
    const editor = createTrackControlEditor()
    const quantizeUnit = 10
    const quantizeFloor = (tick: number) =>
      Math.floor(tick / quantizeUnit) * quantizeUnit

    updateItemsInRange([100, 0], [0, 20], quantizeFloor, quantizeUnit)(editor)

    const items = editor
      .getItems()
      .map((item) => ({ tick: item.tick, value: item.value }))
      .sort((a, b) => a.tick - b.tick)

    expect(items).toStrictEqual([
      { tick: 0, value: 100 },
      { tick: 10, value: 50 },
      { tick: 20, value: 0 },
    ])
  })

  it("pasteItemsAtPosition pastes matching-type clipboard items shifted by position", () => {
    const editor = createTrackControlEditor({
      type: "controller",
      controllerType: 11,
    })
    const data: ClipboardData = {
      type: "control_events",
      valueEventType: { type: "controller", controllerType: 11 },
      events: [
        { id: 1, tick: 0, value: 10 },
        { id: 2, tick: 5, value: 20 },
      ],
    }

    pasteItemsAtPosition(data, 100)(editor)

    const items = editor
      .getItems()
      .map((item) => ({ tick: item.tick, value: item.value }))
      .sort((a, b) => a.tick - b.tick)

    expect(items).toStrictEqual([
      { tick: 100, value: 10 },
      { tick: 105, value: 20 },
    ])
  })

  it("pasteItemsAtPosition refuses clipboard data from a different ValueEventType", () => {
    const editor = createTrackControlEditor({ type: "pitchBend" })
    const data: ClipboardData = {
      type: "control_events",
      valueEventType: { type: "controller", controllerType: 11 },
      events: [{ id: 1, tick: 0, value: 10 }],
    }

    pasteItemsAtPosition(data, 100)(editor)

    expect(editor.getItems()).toStrictEqual([])
  })
})
