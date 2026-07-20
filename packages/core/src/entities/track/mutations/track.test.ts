import { ControllerEvent } from "midifile-ts"
import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { isControllerEvent, isNoteEvent } from "../../event/identify"
import { NoteEvent, TrackEvent, TrackEventOf } from "../../event/TrackEvent"
import { addEvent } from "./basic"
import { duplicateEvents, removeRedundantEventsForEventIds } from "./track"

describe("track mutations/track", () => {
  it("duplicateEvents duplicates selected events using tick span", () => {
    const events = new TickOrderedArray<TrackEvent>()
    const first = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 10,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })(events)
    const second = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 30,
      duration: 10,
      noteNumber: 62,
      velocity: 100,
    })(events)

    const newIds = duplicateEvents([first.id, second.id])(events)

    expect(newIds).toHaveLength(2)

    const duplicatedTicks = newIds
      .map((id) => events.get(id))
      .filter(
        (event): event is NoteEvent =>
          event !== undefined && isNoteEvent(event),
      )
      .map((event) => event.tick)
      .sort((a, b) => a - b)

    expect(duplicatedTicks).toStrictEqual([30, 50])
  })

  it("removeRedundantEventsForEventIds removes redundant events except source event", () => {
    const events = new TickOrderedArray<TrackEvent>()
    const source = addEvent<TrackEventOf<ControllerEvent>>({
      type: "channel",
      subtype: "controller",
      tick: 10,
      controllerType: 7,
      value: 64,
    })(events)
    const redundant = addEvent<TrackEventOf<ControllerEvent>>({
      type: "channel",
      subtype: "controller",
      tick: 10,
      controllerType: 7,
      value: 100,
    })(events)

    removeRedundantEventsForEventIds([source.id])(events)

    const allControllerIds = events
      .getArray()
      .filter(isControllerEvent)
      .map((event) => event.id)

    expect(allControllerIds).toStrictEqual([source.id])
    expect(events.get(redundant.id)).toBeUndefined()
  })
})
