import { Track } from "@signal-app/core"
import { describe, expect, it, vi } from "vitest"
import { createControlEditor } from "./createControlEditor"

describe("createControlEditor", () => {
  it("runs a composed mutation in one transaction, emitting a single change", () => {
    const track = new Track()
    const editor = createControlEditor(track, {
      type: "controller",
      controllerType: 11,
    })
    const first = editor.addItem({ tick: 10, value: 1 })
    const second = editor.addItem({ tick: 20, value: 2 })

    const listener = vi.fn()
    track.onEventsChanged.subscribe(listener)

    // removes two items; without a transaction this would notify twice
    editor.removeItems([first.id, second.id])

    expect(editor.getItemsByIds([first.id, second.id])).toStrictEqual([])
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
