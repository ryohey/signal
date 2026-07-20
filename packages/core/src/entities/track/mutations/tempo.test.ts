import { SetTempoEvent } from "midifile-ts"
import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { bpmToUSecPerBeat } from "../../../helpers/bpm"
import { isSetTempoEvent, isTimeSignatureEvent } from "../../event/identify"
import { TrackEvent, TrackEventOf } from "../../event/TrackEvent"
import { addEvent } from "./basic"
import {
  addClipboardTempoEvents,
  addTimeSignature,
  moveTempoEvents,
} from "./tempo"

describe("track mutations/tempo", () => {
  it("moveTempoEvents moves tick and tempo value", () => {
    const events = new TickOrderedArray<TrackEvent>()
    const tempo = addEvent<TrackEventOf<SetTempoEvent>>({
      type: "meta",
      subtype: "setTempo",
      tick: 10,
      microsecondsPerBeat: 500000,
    })(events)

    moveTempoEvents([tempo.id], 5, 30, 200)(events)

    const updated = events.get(tempo.id)
    expect(updated && isSetTempoEvent(updated) ? updated.tick : null).toBe(15)
    expect(
      updated && isSetTempoEvent(updated) ? updated.microsecondsPerBeat : null,
    ).toBe(Math.floor(bpmToUSecPerBeat(150)))
  })

  it("addClipboardTempoEvents inserts shifted tempo events", () => {
    const events = new TickOrderedArray<TrackEvent>()

    addClipboardTempoEvents(
      {
        type: "tempo_events",
        events: [
          {
            type: "meta",
            subtype: "setTempo",
            tick: 0,
            microsecondsPerBeat: 500000,
          },
          {
            type: "meta",
            subtype: "setTempo",
            tick: 20,
            microsecondsPerBeat: 400000,
          },
        ],
      },
      30,
    )(events)

    const tempoEvents = events.getArray().filter(isSetTempoEvent)
    expect(tempoEvents.map((event) => event.tick)).toStrictEqual([30, 50])
  })

  it("addTimeSignature creates a time signature event at tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const created = addTimeSignature(48, 3, 4)(events)

    expect(created.tick).toBe(48)
    expect(isTimeSignatureEvent(created)).toBe(true)
  })
})
