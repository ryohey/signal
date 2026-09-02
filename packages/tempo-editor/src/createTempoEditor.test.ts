import { Track } from "@signal-app/core"
import { describe, expect, it, vi } from "vitest"
import { createTempoEditor } from "./createTempoEditor"

describe("createTempoEditor", () => {
  it("runs a composed mutation in one transaction, emitting a single change", () => {
    const conductorTrack = new Track()
    const editor = createTempoEditor(conductorTrack)
    editor.createOrUpdateItem(10, 120)
    editor.createOrUpdateItem(20, 150)
    const ids = editor.listItems().map((item) => item.id)

    const listener = vi.fn()
    conductorTrack.onEventsChanged.subscribe(listener)

    // removes two items; without a transaction this would notify twice
    editor.removeItems(ids)

    expect(editor.listItems()).toStrictEqual([])
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
