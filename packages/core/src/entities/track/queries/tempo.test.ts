import { SetTempoEvent } from "midifile-ts"
import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { NoteEvent, TrackEvent, TrackEventOf } from "../../event/TrackEvent"
import { Range } from "../../geometry/Range"
import { addEvent } from "../mutations"
import {
  getSetTempoEventIdsInRange,
  getSetTempoEventsByIds,
  tempoEventsToClipboardData,
} from "./tempo"

describe("track queries/tempo", () => {
  it("getSetTempoEventsByIds filters out non-tempo events", () => {
    const events = new TickOrderedArray<TrackEvent>()
    const tempo = addEvent<TrackEventOf<SetTempoEvent>>({
      type: "meta",
      subtype: "setTempo",
      tick: 10,
      microsecondsPerBeat: 500000,
    })(events)
    const note = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 12,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })(events)

    const result = getSetTempoEventsByIds([note.id, tempo.id])(events)

    expect(result.map((event) => event.id)).toStrictEqual([tempo.id])
  })

  it("getSetTempoEventIdsInRange returns only tempo ids inside range", () => {
    const events = new TickOrderedArray<TrackEvent>()
    const at10 = addEvent<TrackEventOf<SetTempoEvent>>({
      type: "meta",
      subtype: "setTempo",
      tick: 10,
      microsecondsPerBeat: 500000,
    })(events)
    addEvent<TrackEventOf<SetTempoEvent>>({
      type: "meta",
      subtype: "setTempo",
      tick: 30,
      microsecondsPerBeat: 400000,
    })(events)

    const ids = getSetTempoEventIdsInRange(Range.create(0, 20))(events)

    expect(ids).toStrictEqual([at10.id])
  })

  it("tempoEventsToClipboardData normalizes ticks from earliest selected tempo", () => {
    const events = new TickOrderedArray<TrackEvent>()
    const at20 = addEvent<TrackEventOf<SetTempoEvent>>({
      type: "meta",
      subtype: "setTempo",
      tick: 20,
      microsecondsPerBeat: 500000,
    })(events)
    const at40 = addEvent<TrackEventOf<SetTempoEvent>>({
      type: "meta",
      subtype: "setTempo",
      tick: 40,
      microsecondsPerBeat: 400000,
    })(events)

    const data = tempoEventsToClipboardData([at20.id, at40.id])(events)

    expect(data).not.toBeNull()
    expect(data?.type).toBe("tempo_events")
    expect(data?.events.map((event) => event.tick)).toStrictEqual([0, 20])
  })
})
