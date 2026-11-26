import type { ControllerEvent, ProgramChangeEvent } from "midifile-ts";
import { describe, expect, it } from "vitest";
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray";
import { isProgramChangeEvent } from "../../event/identify";
import type { TrackEvent, TrackEventOf } from "../../event/TrackEvent";
import { getBankSelectIds, getPatchAt } from "../queries/program";
import { addEvent } from "./primitives";
import {
    dragProgramChange,
    insertPatchAt,
    moveProgramChange,
    removeProgramChange,
    setPatchAt,
    setPatchById
} from "./program";

const addProgramChange = (
  events: TickOrderedArray<TrackEvent>,
  tick: number,
  value: number,
) =>
  addEvent<TrackEventOf<ProgramChangeEvent>>({
    type: "channel",
    subtype: "programChange",
    tick,
    value,
  })(events)

const addController = (
  events: TickOrderedArray<TrackEvent>,
  tick: number,
  controllerType: number,
  value: number,
) =>
  addEvent<TrackEventOf<ControllerEvent>>({
    type: "channel",
    subtype: "controller",
    controllerType,
    tick,
    value,
  })(events)

const patch = (programNumber: number, bankMSB = 0, bankLSB = 0) => ({
  programNumber,
  bankMSB,
  bankLSB,
})

describe("track mutations/program", () => {
  it("setPatchAt updates last event at or before target tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const existing = addProgramChange(events, 20, 1)
    addProgramChange(events, 80, 5)

    const result = setPatchAt(50, patch(9))(events)
    const updated = events.get(existing.id)

    expect(result.id).toBe(existing.id)
    expect(
      updated && isProgramChangeEvent(updated) ? updated.value : null,
    ).toBe(9)
    expect(events.getArray()).toHaveLength(2)
  })

  it("setPatchAt creates event at tick 0 when no event exists before tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    addProgramChange(events, 80, 5)

    const result = setPatchAt(50, patch(9))(events)

    expect(result.tick).toBe(0)
    expect(result.value).toBe(9)
  })

  it("setPatchAt writes bank select on the program change's tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const existing = addProgramChange(events, 20, 1)

    const result = setPatchAt(50, patch(9, 8, 3))(events)

    expect(result.id).toBe(existing.id)
    expect(events.getArray().filter((e) => e.tick === 20)).toHaveLength(3)
    expect(getPatchAt(50)(events)).toEqual(patch(9, 8, 3))
  })

  it("adds no bank select to a track that never used banks", () => {
    const events = new TickOrderedArray<TrackEvent>()

    addProgramChange(events, 20, 1)
    addProgramChange(events, 960, 2)

    setPatchAt(50, patch(9))(events)

    expect(events.getArray()).toHaveLength(2)
  })

  it("setting a bank keeps the next program change on its bank", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const first = addProgramChange(events, 0, 1)
    addProgramChange(events, 960, 2)
    addProgramChange(events, 1920, 3)

    setPatchById(first.id, patch(1, 8))(events)

    expect(getPatchAt(0)(events)).toEqual(patch(1, 8))
    expect(getPatchAt(960)(events)).toEqual(patch(2))
    expect(getPatchAt(1920)(events)).toEqual(patch(3))
  })

  it("the first bank in a track also sets bank 0 on the first program change", () => {
    const events = new TickOrderedArray<TrackEvent>()

    addProgramChange(events, 0, 1)
    const middle = addProgramChange(events, 960, 2)
    addProgramChange(events, 1920, 3)

    setPatchById(middle.id, patch(2, 8))(events)

    const atStart = events.getArray().filter((e) => e.tick === 0)
    expect(atStart).toHaveLength(2)
    expect(getPatchAt(0)(events)).toEqual(patch(1))
    expect(getPatchAt(960)(events)).toEqual(patch(2, 8))
    expect(getPatchAt(1920)(events)).toEqual(patch(3))
  })

  it("a moved program change keeps its own program on a shared tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const moved = addProgramChange(events, 0, 5)
    addProgramChange(events, 0, 10)

    const ids = getBankSelectIds(moved.id)(events)
    dragProgramChange(moved.id, ids, 960)(events)
    moveProgramChange(moved.id, ids, 0, 960)(events)

    expect(events.get(moved.id)).toMatchObject({ tick: 960, value: 5 })
  })

  it("removing a program change keeps the next one on its bank", () => {
    const events = new TickOrderedArray<TrackEvent>()

    addController(events, 0, 0, 8)
    const first = addProgramChange(events, 0, 1)
    addProgramChange(events, 960, 2)

    removeProgramChange(first.id)(events)

    expect(getPatchAt(960)(events)).toEqual(patch(2, 8))
    expect(events.getArray().filter((e) => e.tick === 0)).toHaveLength(0)
  })

  it("setPatchById updates the last bank select on the tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    addController(events, 0, 0, 8)
    const lastOne = addController(events, 0, 0, 16)
    const existing = addProgramChange(events, 0, 1)

    setPatchById(existing.id, patch(1, 24))(events)

    expect(events.get(lastOne.id)).toMatchObject({ value: 24 })
    expect(getPatchAt(0)(events)).toEqual(patch(1, 24))
  })

  it("insertPatchAt updates a program change already on the tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    addController(events, 50, 0, 8)
    const existing = addProgramChange(events, 50, 1)

    const result = insertPatchAt(50, patch(9, 8))(events)

    expect(result.id).toBe(existing.id)
    expect(events.getArray()).toHaveLength(2)
  })

  it("insertPatchAt adds event at tick without updating existing ones", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const existing = addProgramChange(events, 20, 1)

    const result = insertPatchAt(50, patch(9))(events)
    const unchanged = events.get(existing.id)

    expect(result.id).not.toBe(existing.id)
    expect(result.tick).toBe(50)
    expect(result.value).toBe(9)
    expect(
      unchanged && isProgramChangeEvent(unchanged) ? unchanged.value : null,
    ).toBe(1)
  })

  // A drag moves the ticks with dragProgramChange, then settles with
  // moveProgramChange on mouse up
  const dragTo = (
    events: TickOrderedArray<TrackEvent>,
    eventId: number,
    path: number[],
  ) => {
    const from = events.get(eventId)?.tick ?? 0
    const ids = getBankSelectIds(eventId)(events)
    let current = from
    for (const tick of path) {
      if (dragProgramChange(eventId, ids, tick)(events)) {
        current = tick
      }
    }
    moveProgramChange(eventId, ids, from, current)(events)
  }

  it("a drag skips ticks that have another program change", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const msb = addController(events, 20, 0, 8)
    const moved = addProgramChange(events, 20, 1)
    const other = addController(events, 60, 0, 16)
    addProgramChange(events, 60, 2)

    dragTo(events, moved.id, [60])

    expect(events.get(moved.id)?.tick).toBe(20)
    expect(events.get(msb.id)?.tick).toBe(20)
    expect(events.get(other.id)?.tick).toBe(60)
  })

  it("a moved program change keeps the patch it played", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const moved = addProgramChange(events, 0, 5)
    addController(events, 960, 0, 8)
    addProgramChange(events, 960, 10)

    dragTo(events, moved.id, [1500])

    expect(getPatchAt(1500)(events)).toEqual(patch(5))
  })

  it("moving a program change keeps the next one on its bank", () => {
    const events = new TickOrderedArray<TrackEvent>()

    addController(events, 0, 0, 4)
    addProgramChange(events, 0, 1)
    addController(events, 480, 0, 8)
    const moved = addProgramChange(events, 480, 2)
    addProgramChange(events, 960, 3)

    dragTo(events, moved.id, [490])

    expect(getPatchAt(490)(events)).toEqual(patch(2, 8))
    expect(getPatchAt(960)(events)).toEqual(patch(3, 8))
  })

  it("a stray bank select on the destination tick takes the moved bank", () => {
    const events = new TickOrderedArray<TrackEvent>()

    addController(events, 0, 0, 8)
    const moved = addProgramChange(events, 0, 1)
    addController(events, 900, 0, 16)
    addProgramChange(events, 960, 2)

    dragTo(events, moved.id, [900])

    expect(getPatchAt(900)(events)).toEqual(patch(1, 8))
    expect(getPatchAt(960)(events)).toEqual(patch(2, 16))
  })

  it("dragging away and back leaves the song as it was", () => {
    const events = new TickOrderedArray<TrackEvent>()

    addController(events, 0, 0, 8)
    const moved = addProgramChange(events, 0, 5)
    addProgramChange(events, 960, 10)
    addProgramChange(events, 1920, 20)
    const before = events.getArray().map((e) => ({ ...e }))

    dragTo(events, moved.id, [3000, 0])

    expect(events.getArray()).toEqual(before)
  })
})
