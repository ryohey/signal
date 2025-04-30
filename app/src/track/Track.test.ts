import { deserialize, serialize } from "serializr"
import Track from "./Track"
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
})
