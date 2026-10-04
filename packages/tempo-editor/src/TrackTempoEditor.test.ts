import { describe, expect, it, vi } from "vitest"
import { createTrackTempoEditor } from "./testUtils"

describe("TrackTempoEditor", () => {
  it("gets all tempo items and an item by ID", () => {
    const editor = createTrackTempoEditor([{ tick: 10, bpm: 120 }])
    const [item] = editor.getItems()

    expect(editor.getItems()).toContainEqual(item)
    expect(editor.getById(item.id)).toStrictEqual(item)
    expect(editor.getById(-1)).toBeUndefined()
  })

  it("adds, updates, and removes items", () => {
    const editor = createTrackTempoEditor()

    const added = editor.addItem({ tick: 10, bpm: 120 })
    editor.updateItem({ ...added, tick: 20, bpm: 150 })
    editor.removeItem(added.id)

    expect(editor.getItems()).toStrictEqual([])
  })

  it("observes tempo item changes", () => {
    const editor = createTrackTempoEditor()
    const listener = vi.fn()
    const unsubscribe = editor.observeItems(listener)

    editor.addItem({ tick: 10, bpm: 120 })
    unsubscribe()
    editor.addItem({ tick: 20, bpm: 150 })

    expect(listener).toHaveBeenCalledTimes(1)
  })
})
