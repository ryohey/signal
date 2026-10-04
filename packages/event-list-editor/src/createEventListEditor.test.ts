import { controllerMidiEvent, Track } from "@signal-app/core"
import { describe, expect, it } from "vitest"
import { createEventListEditor } from "./createEventListEditor"

describe("createEventListEditor", () => {
  it("wires items/removeEvent/updateEvent/dispose to the track", () => {
    const track = new Track()
    track.channel = 0
    const [event] = track.addEvents([
      { ...controllerMidiEvent(0, 0, 11, 64), tick: 10 },
    ])

    const editor = createEventListEditor(track)

    expect(editor.items).toMatchObject([{ id: event.id, tick: 10 }])

    editor.updateEvent(event.id, { tick: 20 })
    expect(editor.items).toMatchObject([{ tick: 20 }])

    editor.removeEvent(event.id)
    expect(editor.items).toStrictEqual([])

    editor.dispose()
  })
})
