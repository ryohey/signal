import { controllerMidiEvent, setTempoMidiEvent, Track } from "@signal-app/core"
import { describe, expect, it } from "vitest"
import { TrackEventListEditor } from "./TrackEventListEditor"

const newChannelTrack = () => {
  // Track.addEvents drops "channel"-type events (including controller
  // events) on the conductor track, and a fresh Track defaults to being
  // one (no channel assigned). Give it an explicit channel so tests can
  // add controller events.
  const track = new Track()
  track.channel = 0
  return track
}

const addControllerEvent = (track: Track, tick: number, value: number = 64) => {
  const [event] = track.addEvents([
    { ...controllerMidiEvent(0, 0, 11, value), tick },
  ])
  return event
}

describe("TrackEventListEditor", () => {
  it("lists every event when no selection is set", () => {
    const track = newChannelTrack()
    addControllerEvent(track, 10)
    addControllerEvent(track, 20)
    const editor = new TrackEventListEditor(track)

    expect(editor.items).toHaveLength(2)
  })

  it("updateSelectedIds narrows items to the given ids", () => {
    const track = newChannelTrack()
    const first = addControllerEvent(track, 10)
    addControllerEvent(track, 20)
    const editor = new TrackEventListEditor(track)

    editor.updateSelectedIds([first.id])

    expect(editor.items).toMatchObject([{ id: first.id }])
  })

  it("computes controller metadata for each item's subtype", () => {
    const track = new Track()
    track.addEvents([{ ...setTempoMidiEvent(0, 500000), tick: 0 }])
    const editor = new TrackEventListEditor(track)

    expect(editor.items).toMatchObject([{ controller: { name: "Tempo" } }])
  })

  it("removeEvent removes the event and notifies", () => {
    const track = newChannelTrack()
    const event = addControllerEvent(track, 10)
    const editor = new TrackEventListEditor(track)

    editor.removeEvent(event.id)

    expect(editor.items).toStrictEqual([])
  })

  it("updateEvent applies a partial patch to the underlying event", () => {
    const track = newChannelTrack()
    const event = addControllerEvent(track, 10)
    const editor = new TrackEventListEditor(track)

    editor.updateEvent(event.id, { tick: 40 })

    expect(editor.items).toMatchObject([{ id: event.id, tick: 40 }])
  })

  it("dispose stops the editor from reacting to further track changes", () => {
    const track = newChannelTrack()
    const editor = new TrackEventListEditor(track)

    editor.dispose()
    addControllerEvent(track, 10)

    expect(editor.items).toStrictEqual([])
  })
})
