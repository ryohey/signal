import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { NoteEvent, TrackEvent } from "../../event/TrackEvent"
import {
  addEvents,
  createOrUpdate,
  removeEvents,
  updateEvents,
  updateOrAdd,
} from "./composed"
import { addEvent } from "./primitives"

describe("track mutations/composed", () => {
  it("addEvents should add multiple note events", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const created = addEvents<NoteEvent>([
      {
        type: "channel",
        subtype: "note",
        tick: 10,
        duration: 20,
        noteNumber: 60,
        velocity: 100,
      },
      {
        type: "channel",
        subtype: "note",
        tick: 30,
        duration: 20,
        noteNumber: 62,
        velocity: 100,
      },
    ])(events)

    expect(created).toHaveLength(2)
    expect(events.getArray().length).toBe(2)
  })

  it("updateEvents should update multiple note events", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const first = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })(events)
    const second = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 30,
      duration: 20,
      noteNumber: 62,
      velocity: 100,
    })(events)

    updateEvents([
      { id: first.id, velocity: 80 },
      { id: second.id, noteNumber: 64 },
    ])(events)

    const updatedFirst = events.get(first.id) as NoteEvent | undefined
    const updatedSecond = events.get(second.id) as NoteEvent | undefined

    expect(updatedFirst?.velocity).toBe(80)
    expect(updatedSecond?.noteNumber).toBe(64)
  })

  it("updateOrAdd should update existing event", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const existing = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 20,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })(events)

    const updated = updateOrAdd<NoteEvent>(
      (allEvents) =>
        allEvents.find((event) => event.id === existing.id) as
          | NoteEvent
          | undefined,
      {
        type: "channel",
        subtype: "note",
        tick: 999,
        duration: 12,
        noteNumber: 61,
        velocity: 70,
      },
    )(events)

    expect(updated?.id).toBe(existing.id)
    expect(updated?.tick).toBe(20)
    expect(updated?.velocity).toBe(70)
  })

  it("updateOrAdd should add event when target is not found", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const added = updateOrAdd<NoteEvent>(() => undefined, {
      type: "channel",
      subtype: "note",
      tick: 40,
      duration: 8,
      noteNumber: 65,
      velocity: 90,
    })(events)

    expect(added).toBeDefined()
    expect(added?.tick).toBe(40)
  })

  it("createOrUpdate should update redundant event", () => {
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
  })

  it("createOrUpdate should create event on different tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    createOrUpdate<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })(events)

    const createdAtDifferentTick = createOrUpdate<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 789,
      tick: 456,
      velocity: 50,
      noteNumber: 300,
    })(events)

    expect(createdAtDifferentTick.tick).toBe(456)
    const differentTick = events.get(createdAtDifferentTick.id) as
      | NoteEvent
      | undefined
    expect(differentTick).toBeDefined()
    expect(differentTick?.tick).toBe(456)
    expect(differentTick?.duration).toBe(789)
    expect(differentTick?.velocity).toBe(50)
    expect(differentTick?.noteNumber).toBe(300)
  })

  it("removeEvents removes multiple events by ids", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const first = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })(events)
    const second = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 30,
      duration: 20,
      noteNumber: 62,
      velocity: 100,
    })(events)

    removeEvents([first.id, second.id])(events)

    expect(events.get(first.id)).toBeUndefined()
    expect(events.get(second.id)).toBeUndefined()
  })
})
