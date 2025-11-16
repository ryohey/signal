import { deserialize, serialize } from "serializr"
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
    const s = serialize(track)
    const t = deserialize(Track, s)
    expect(t.channel).toBe(5)
    expect(t.endOfTrack).toBe(track.endOfTrack)
    expect(t.events.length).toBe(1)
    expect(t.events[0].tick).toBe(123)
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
    expect(track.getPan(1)).toBe(64)
    track.setPan(100, 1)
    expect(track.getPan(1)).toBe(100)
  })
  it("should update volume after setVolume", () => {
    const track = emptyTrack(1)
    expect(track.getVolume(1)).toBe(100)
    track.setVolume(50, 1)
    expect(track.getVolume(1)).toBe(50)
  })
  it("should update program number after setProgramNumber", () => {
    const track = emptyTrack(1)
    expect(track.programNumber).toBe(0)
    track.setProgramNumber(100)
    expect(track.programNumber).toBe(100)
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
})
