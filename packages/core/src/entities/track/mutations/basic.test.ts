import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { bpmToUSecPerBeat } from "../../../helpers/bpm"
import { getTempoEvent } from "../../event/selectors"
import { NoteEvent, TrackEvent } from "../../event/TrackEvent"
import {
  addEvent,
  createOrUpdate,
  removeEvents,
  setTempo,
  updateEvent,
} from "./basic"

describe("track mutations/basic", () => {
  it("addEvent/updateEvent/removeEvents should manipulate note events", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const created = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })(events)

    expect(created.tick).toBe(123)
    expect(created.duration).toBe(120)
    expect(created.velocity).toBe(100)
    expect(created.noteNumber).toBe(100)

    updateEvent<NoteEvent>(created.id, {
      tick: 456,
      duration: 789,
      velocity: 50,
      noteNumber: 200,
    })(events)

    const updated = events.get(created.id) as NoteEvent | undefined
    expect(updated).toBeDefined()
    expect(updated?.tick).toBe(456)
    expect(updated?.duration).toBe(789)
    expect(updated?.velocity).toBe(50)
    expect(updated?.noteNumber).toBe(200)

    removeEvents([created.id])(events)
    expect(events.get(created.id)).toBeUndefined()
  })

  it("createOrUpdate should update redundant events and create new events for different ticks", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const first = createOrUpdate<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })(events)

    const updated = createOrUpdate<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 456,
      tick: 123,
      velocity: 200,
      noteNumber: 200,
    })(events)

    expect(updated.id).toBe(first.id)
    const sameTick = events.get(updated.id) as NoteEvent | undefined
    expect(sameTick).toBeDefined()
    expect(sameTick?.tick).toBe(123)
    expect(sameTick?.duration).toBe(456)
    expect(sameTick?.velocity).toBe(200)
    expect(sameTick?.noteNumber).toBe(200)

    const createdAtDifferentTick = createOrUpdate<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 789,
      tick: 456,
      velocity: 50,
      noteNumber: 300,
    })(events)

    expect(createdAtDifferentTick.id).not.toBe(first.id)
    const differentTick = events.get(createdAtDifferentTick.id) as
      | NoteEvent
      | undefined
    expect(differentTick).toBeDefined()
    expect(differentTick?.tick).toBe(456)
    expect(differentTick?.duration).toBe(789)
    expect(differentTick?.velocity).toBe(50)
    expect(differentTick?.noteNumber).toBe(300)
  })

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
