import { isEqual, omit } from "lodash"
import { isDevelopment } from "../../../helpers/isDevelopment"
import { TrackEvent } from "../../event/TrackEvent"
import { validateMidiEvent } from "../../event/validate"
import { getEventById } from "../queries"
import { TrackEventsMutator } from "./type"

export const removeEvent =
  (id: number): TrackEventsMutator =>
  (events) => {
    events.remove(id)
  }

export const updateEvent =
  <T extends TrackEvent>(
    id: number,
    obj: Partial<T>,
  ): TrackEventsMutator<T | null> =>
  (events) => {
    const anObj = getEventById(id)(events)
    if (anObj === undefined) {
      console.warn(`unknown id: ${id}`)
      return null
    }
    const newObj = { ...anObj, ...obj }
    if (isEqual(newObj, anObj)) {
      return null
    }
    events.update(id, newObj)

    if (isDevelopment()) {
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
    const newEvent = events.create({
      ...omit(e, ["deltaTime", "channel"]),
    } as T) as T
    if (isDevelopment()) {
      validateMidiEvent(newEvent)
    }
    return newEvent
  }
