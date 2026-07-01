import { describe, expect, it } from "vitest"
import { getPan, getVolume } from "./selector"
import { Track } from "./Track"
import { NoteEvent } from "./TrackEvent"
import { emptyTrack } from "./TrackFactory"

describe("Track", () => {
  it("should be serializable", () => {
    const track = new Track()
    track.channel = 5
    track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })
    const s = track.serialize()
    const t = Track.deserialize(s)
    expect(t.channel).toBe(5)
    expect(t.endOfTrack).toBe(track.endOfTrack)
    expect(t.events.length).toBe(1)
    expect(t.events[0].tick).toBe(123)
  })

  it("should serialize to a POJO", () => {
    const track = new Track()
    track.channel = 5
    track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })

    expect(track.serialize()).toStrictEqual({
      id: track.id,
      _events: {
        array: track.events,
        descending: false,
        lookupMap: track.events,
        lastEventId: 1,
      },
      channel: 5,
      endOfTrack: track.endOfTrack,
    })
  })

  it("should deserialize from its own serialized POJO", () => {
    const track = new Track()
    track.channel = 5
    track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })

    const restored = Track.deserialize(track.serialize())

    expect(restored.serialize()).toStrictEqual(track.serialize())
  })
  it("should manipulate events correctly", () => {
    const track = emptyTrack(1)
    const { id } = track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })
    const noteEvent = track.getEventById(id) as NoteEvent
    expect(noteEvent.tick).toBe(123)
    expect(noteEvent.duration).toBe(120)
    expect(noteEvent.velocity).toBe(100)
    expect(noteEvent.noteNumber).toBe(100)
    expect(track.endOfTrack).toBe(243)
    track.updateEvent(noteEvent.id, {
      ...noteEvent,
      tick: 456,
      duration: 789,
      velocity: 50,
      noteNumber: 200,
    })
    const updatedEvent = track.getEventById(noteEvent.id) as NoteEvent
    expect(updatedEvent.tick).toBe(456)
    expect(updatedEvent.duration).toBe(789)
    expect(updatedEvent.velocity).toBe(50)
    expect(updatedEvent.noteNumber).toBe(200)
    expect(track.endOfTrack).toBe(456 + 789)
    track.removeEvent(id)
    expect(track.getEventById(id)).toBeUndefined()
    expect(track.endOfTrack).toBe(456 + 789) // don't update end of track
  })
  it("should createOrUpdate events correctly", () => {
    const track = emptyTrack(1)
    const { id } = track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })
    const noteEvent = track.getEventById(id) as NoteEvent
    expect(noteEvent.tick).toBe(123)
    expect(noteEvent.duration).toBe(120)
    expect(noteEvent.velocity).toBe(100)
    expect(noteEvent.noteNumber).toBe(100)
    expect(track.endOfTrack).toBe(243)
    // try to create a new event with the same tick
    const { id: updatedEventId } = track.createOrUpdate<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 456,
      tick: 123,
      velocity: 200,
      noteNumber: 200,
    })
    const updatedEvent = track.getEventById(updatedEventId) as NoteEvent
    expect(updatedEventId).toBe(id)
    expect(updatedEvent.tick).toBe(123)
    expect(updatedEvent.duration).toBe(456)
    expect(updatedEvent.velocity).toBe(200)
    expect(updatedEvent.noteNumber).toBe(200)
    // try to create a new event with a different tick
    const { id: newEventId } = track.createOrUpdate<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 789,
      tick: 456,
      velocity: 50,
      noteNumber: 300,
    })
    const newEvent = track.getEventById(newEventId) as NoteEvent
    expect(newEventId).not.toBe(id)
    expect(newEvent.tick).toBe(456)
    expect(newEvent.duration).toBe(789)
    expect(newEvent.velocity).toBe(50)
    expect(newEvent.noteNumber).toBe(300)
  })
  it("endOfTrack() should reset end of track after note deletion", () => {
    const track = emptyTrack(5)
    const noteEvent = track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })
    expect(track.endOfTrack).toBe(243)
    track.removeEvent(noteEvent.id)
    track.updateEndOfTrack()
    expect(track.endOfTrack).toBe(0)
  })
  it("should update pan after setPan", () => {
    const track = emptyTrack(1)
    expect(getPan(track.events, 1)).toBe(64)
    track.setPan(100, 1)
    expect(getPan(track.events, 1)).toBe(100)
  })
  it("should update volume after setVolume", () => {
    const track = emptyTrack(1)
    expect(getVolume(track.events, 1)).toBe(100)
    track.setVolume(50, 1)
    expect(getVolume(track.events, 1)).toBe(50)
  })
  it("should update color after setColor", () => {
    const track = emptyTrack(1)
    expect(track.color).toBe(undefined)
    track.setColor({
      red: 255,
      green: 128,
      blue: 92,
      alpha: 1,
    })
    expect(track.color).toMatchObject({
      red: 255,
      green: 128,
      blue: 92,
      alpha: 1,
    })
  })

  it("should notify channel and track type changes", () => {
    const track = new Track()
    let channelChanges = 0
    let conductorChanges = 0
    let rhythmChanges = 0

    track.onChannelChanged.subscribe(() => channelChanges++)
    track.onIsConductorTrackChanged.subscribe(() => conductorChanges++)
    track.onIsRhythmTrackChanged.subscribe(() => rhythmChanges++)

    track.channel = 1
    track.channel = 9
    track.channel = 9
    track.channel = undefined

    expect(channelChanges).toBe(3)
    expect(conductorChanges).toBe(2)
    expect(rhythmChanges).toBe(2)
  })

  it("should notify onChanged for non-derived state changes", () => {
    const track = new Track()
    let changes = 0

    track.onChanged.subscribe(() => changes++)

    track.id = 1 as Track["id"]
    track.channel = 1
    track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })

    expect(changes).toBe(3)
  })
})
