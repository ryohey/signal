import { Track } from "@signal-app/core"
import { describe, expect, it, vi } from "vitest"
import { TrackControlEditor } from "./TrackControlEditor"
import { createTrackControlEditor } from "./testUtils"

describe("TrackControlEditor", () => {
  it("adds, gets, updates, and removes items", () => {
    const editor = createTrackControlEditor()

    const added = editor.addItem({ tick: 10, value: 64 })
    expect(editor.getById(added.id)).toStrictEqual(added)
    expect(editor.getItems()).toContainEqual(added)

    editor.updateItem({ ...added, value: 100 })
    expect(editor.getById(added.id)?.value).toBe(100)

    editor.removeItem(added.id)
    expect(editor.getItems()).toStrictEqual([])
  })

  it("only sees items matching its own type", () => {
    const track = new Track()
    const volumeEditor = new TrackControlEditor(track, {
      type: "controller",
      controllerType: 7,
    })
    const panEditor = new TrackControlEditor(track, {
      type: "controller",
      controllerType: 10,
    })
    const pitchBendEditor = new TrackControlEditor(track, { type: "pitchBend" })

    volumeEditor.addItem({ tick: 0, value: 100 })
    panEditor.addItem({ tick: 0, value: 64 })
    pitchBendEditor.addItem({ tick: 0, value: 0 })

    expect(volumeEditor.getItems()).toHaveLength(1)
    expect(panEditor.getItems()).toHaveLength(1)
    expect(pitchBendEditor.getItems()).toHaveLength(1)
  })

  it("observes item changes", () => {
    const editor = createTrackControlEditor()
    const listener = vi.fn()
    const unsubscribe = editor.observeItems(listener)

    editor.addItem({ tick: 10, value: 64 })
    unsubscribe()
    editor.addItem({ tick: 20, value: 100 })

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("creates a preview MIDI event for the editor's own type without mutating anything", () => {
    const editor = createTrackControlEditor({
      type: "controller",
      controllerType: 7,
    })

    const event = editor.createPreviewEvent(100)

    expect(event).toMatchObject({
      subtype: "controller",
      controllerType: 7,
      value: 100,
    })
    expect(editor.getItems()).toStrictEqual([])
  })
})
