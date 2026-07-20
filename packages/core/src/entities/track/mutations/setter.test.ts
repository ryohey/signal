import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { bpmToUSecPerBeat } from "../../../helpers/bpm"
import { getTempoEvent } from "../../event/selectors"
import { TrackEvent } from "../../event/TrackEvent"
import { setTempo } from "./setter"

describe("track mutations/setter", () => {
  it("setTempo should upsert tempo event at the target tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    setTempo(120, 240)(events)
    const first = getTempoEvent(240)(events.getArray())
    expect(first?.microsecondsPerBeat).toBe(Math.floor(bpmToUSecPerBeat(120)))

    setTempo(150, 240)(events)
    const updated = getTempoEvent(240)(events.getArray())
    expect(updated?.microsecondsPerBeat).toBe(Math.floor(bpmToUSecPerBeat(150)))
  })
})
