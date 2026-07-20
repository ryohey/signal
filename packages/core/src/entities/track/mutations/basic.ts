import { isEqual, omit } from "lodash"
import { TrackEvent } from "../../event/TrackEvent"
import { validateMidiEvent } from "../../event/validate"
import { getEventById } from "../queries"
import { TrackEventsContext } from "../TrackEventsContext"
import { TrackEventsMutator } from "./type"

type MutableTrackEvents = TrackEventsContext & {
  remove(id: number): readonly TrackEvent[]
  update(id: number, updatedElement: Partial<TrackEvent>): readonly TrackEvent[]
  create(event: Omit<TrackEvent, "id">): TrackEvent
}

const asMutableTrackEvents = (events: TrackEventsContext): MutableTrackEvents =>
  events as MutableTrackEvents

export const removeEvent =
  (id: number): TrackEventsMutator =>
  (events) => {
    asMutableTrackEvents(events).remove(id)
  }

export const updateEvent =
  <T extends TrackEvent>(
    id: number,
    obj: Partial<T>,
  ): TrackEventsMutator<T | null> =>
  (events) => {
    console.log(`updateEvent: ${id}`)
    const anObj = getEventById(id)(events)
    if (anObj === undefined) {
      console.warn(`unknown id: ${id}`)
      return null
    }
    const newObj = { ...anObj, ...obj }
    if (isEqual(newObj, anObj)) {
      return null
    }
    asMutableTrackEvents(events).update(id, newObj)

    if (process.env.NODE_ENV !== "production") {
      validateMidiEvent(newObj)
    }

    return newObj as T
  }

export const addEvent =
  <T extends TrackEvent>(
    e: Omit<T, "id"> & { subtype?: string },
  ): TrackEventsMutator<T> =>
  (events) => {
    if (!("tick" in e) || Number.isNaN(e.tick)) {
      throw new Error("invalid event is added")
    }
    if ("subtype" in e && e.subtype === "endOfTrack") {
      throw new Error("endOfTrack event is added")
    }
    return asMutableTrackEvents(events).create({
      ...omit(e, ["deltaTime", "channel"]),
    } as T) as T
  }
