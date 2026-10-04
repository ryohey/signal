import { Range } from "@signal-app/core"
import { describe, expect, it } from "vitest"
import { getItemsByIds } from "../queries/items"
import { createTrackTempoEditor } from "../testUtils"
import {
  createOrUpdateItem,
  duplicateItems,
  moveItems,
  pasteItemsAtPosition,
  removeItems,
  removeRedundantItems,
  setBpm,
  updateItemsInRange,
} from "./composed"

describe("tempo editor composed mutations", () => {
  it("removes selected items", () => {
    const editor = createTrackTempoEditor([
      { tick: 10, bpm: 120 },
      { tick: 20, bpm: 150 },
    ])
    const [first] = editor.getItems()

    removeItems([first.id])(editor)

    expect(editor.getItems()).toMatchObject([{ tick: 20, bpm: 150 }])
  })

  it("duplicates items using their selection span", () => {
    const editor = createTrackTempoEditor([
      { tick: 10, bpm: 100 },
      { tick: 20, bpm: 200 },
    ])
    const selected = editor.getItems()

    const addedIds = duplicateItems(selected.map((item) => item.id))(editor)

    expect(getItemsByIds(addedIds)(editor)).toMatchObject([
      { tick: 20, bpm: 100 },
      { tick: 30, bpm: 200 },
    ])
  })

  it("pastes clipboard items at the target tick", () => {
    const editor = createTrackTempoEditor()

    pasteItemsAtPosition(
      {
        type: "tempo_events",
        items: [
          { id: 1, tick: 0, bpm: 120 },
          { id: 2, tick: 20, bpm: 150 },
        ],
      },
      60,
    )(editor)

    expect(editor.getItems()).toMatchObject([
      { tick: 60, bpm: 120 },
      { tick: 80, bpm: 150 },
    ])
  })

  it("moves selected items and clamps their values", () => {
    const editor = createTrackTempoEditor([
      { tick: 10, bpm: 120 },
      { tick: 20, bpm: 180 },
    ])
    const selected = editor.getItems()

    moveItems(
      selected.map((item) => item.id),
      -20,
      30,
      200,
    )(editor)

    expect(editor.getItems()).toMatchObject([
      { tick: 0, bpm: 150 },
      { tick: 0, bpm: 200 },
    ])
  })

  it("removes redundant items at selected ticks", () => {
    const editor = createTrackTempoEditor([
      { tick: 10, bpm: 120 },
      { tick: 20, bpm: 150 },
    ])
    const [source] = editor.getItems()
    editor.addItem({ tick: source.tick, bpm: 160 })

    removeRedundantItems([source.id])(editor)

    expect(editor.getItems()).toMatchObject([
      { id: source.id, tick: 10, bpm: 120 },
      { tick: 20, bpm: 150 },
    ])
  })

  it("creates an item or updates all items at the same tick", () => {
    const editor = createTrackTempoEditor([{ tick: 10, bpm: 120 }])

    createOrUpdateItem(10, 150)(editor)
    createOrUpdateItem(20, 200)(editor)

    expect(editor.getItems()).toMatchObject([
      { tick: 10, bpm: 150 },
      { tick: 20, bpm: 200 },
    ])
  })

  it("updates tempo items across a quantized range", () => {
    const editor = createTrackTempoEditor([
      { tick: 0, bpm: 50 },
      { tick: 10, bpm: 50 },
      { tick: 20, bpm: 50 },
    ])

    updateItemsInRange(
      Range.create(100, 200),
      Range.create(0, 20),
      (tick) => tick,
      10,
    )(editor)

    expect(editor.getItems()).toMatchObject([
      { tick: 0, bpm: 100 },
      { tick: 10, bpm: 150 },
      { tick: 20, bpm: 200 },
    ])
  })

  it("sets BPM only when the item exists", () => {
    const editor = createTrackTempoEditor([{ tick: 10, bpm: 120 }])
    const [item] = editor.getItems()

    setBpm(item.id, 150)(editor)
    setBpm(-1, 180)(editor)

    expect(editor.getItems()).toMatchObject([{ tick: 10, bpm: 150 }])
  })
})
