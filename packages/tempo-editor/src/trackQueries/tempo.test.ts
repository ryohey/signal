import { NoteEvent, Track, TrackEventOf } from "@signal-app/core"
import { SetTempoEvent } from "midifile-ts"
import { describe, expect, it } from "vitest"
import { getTempoItemById } from "./tempo"

describe("track queries/tempo", () => {
  it("getTempoItemById returns only the requested tempo item", () => {
    const track = new Track()
    track.channel = 0
    const tempo = track.addEvent<TrackEventOf<SetTempoEvent>>({
      type: "meta",
      subtype: "setTempo",
      tick: 10,
      microsecondsPerBeat: 500000,
    })
    const note = track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 12,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })

    expect(getTempoItemById(tempo.id)(track)).toStrictEqual({
      id: tempo.id,
      tick: 10,
      bpm: 120,
    })
    expect(getTempoItemById(note.id)(track)).toBeUndefined()
    expect(getTempoItemById(999)(track)).toBeUndefined()
  })
})
