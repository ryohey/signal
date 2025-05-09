import { isEqual, omit } from "lodash"
import {
  ControllerEvent,
  ProgramChangeEvent,
  SetTempoEvent,
  TrackNameEvent,
} from "midifile-ts"
import { transaction } from "mobx"
import { bpmToUSecPerBeat } from "../../helpers/bpm"
import { TickOrderedArray } from "../../helpers/TickOrderedArray"
import {
  programChangeMidiEvent,
  setTempoMidiEvent,
  trackNameMidiEvent,
} from "../../midi/MidiEvent"
import {
  isControllerEventWithType,
  isNoteEvent,
  TrackEvent,
  TrackEventOf,
} from "../../track"
import {
  getLast,
  getProgramNumberEvent,
  getTempoEvent,
  getTrackNameEvent,
  isTickBefore,
} from "../../track/selector"
import {
  isSignalTrackColorEvent,
  SignalTrackColorEvent,
} from "../../track/signalEvents"
import { TrackColor } from "../../track/TrackColor"
import { validateMidiEvent } from "../../track/validate"

export namespace TrackEvents {
  // array mutation

  export const updateEvent =
    <T extends TrackEvent>(id: number, obj: Partial<T>) =>
    (events: TickOrderedArray<TrackEvent>): T | null => {
      const anObj = events.get(id)
      if (anObj === undefined) {
        console.warn(`unknown id: ${id}`)
        return null
      }
      const newObj = { ...anObj, ...obj }
      if (isEqual(newObj, anObj)) {
        return null
      }
      events.update(id, newObj)

      if (process.env.NODE_ENV !== "production") {
        validateMidiEvent(newObj)
      }

      return newObj as T
    }

  export const addEvent =
    <T extends TrackEvent>(e: Omit<T, "id"> & { subtype?: string }) =>
    (events: TickOrderedArray<TrackEvent>): T => {
      if (!("tick" in e) || isNaN(e.tick)) {
        throw new Error("invalid event is added")
      }
      if ("subtype" in e && e.subtype === "endOfTrack") {
        throw new Error("endOfTrack event is added")
      }
      return events.create({
        ...omit(e, ["deltaTime", "channel"]),
      } as T) as T
    }

  const getRedundantEvents =
    <T extends TrackEvent>(
      event: Omit<T, "id"> & { subtype?: string; controllerType?: number },
    ) =>
    (events: readonly TrackEvent[]): TrackEvent[] => {
      return events.filter(
        (e) =>
          e.type === event.type &&
          e.tick === event.tick &&
          ("subtype" in e && "subtype" in event
            ? e.subtype === event.subtype
            : true) &&
          ("controllerType" in e && "controllerType" in event
            ? e.controllerType === event.controllerType
            : true),
      )
    }

  export const removeRedundantEvents =
    <T extends TrackEvent>(
      event: T & { subtype?: string; controllerType?: number },
    ) =>
    (events: TickOrderedArray<TrackEvent>) => {
      getRedundantEvents(event)(events.getArray())
        .filter((e) => e.id !== event.id)
        .map((e) => e.id)
        .forEach((id) => {
          events.remove(id)
        })
    }

  export const createOrUpdate =
    <T extends TrackEvent>(
      newEvent: Omit<T, "id"> & { subtype?: string; controllerType?: number },
    ) =>
    (anEvents: TickOrderedArray<TrackEvent>): T => {
      const events = getRedundantEvents(newEvent)(anEvents.getArray())

      if (events.length > 0) {
        transaction(() => {
          events.forEach((e) => {
            updateEvent(e.id, { ...newEvent, id: e.id } as Partial<T>)(anEvents)
          })
        })
        return events[0] as T
      } else {
        return addEvent(newEvent)(anEvents)
      }
    }

  export const getMaxTick = (events: readonly TrackEvent[]) => {
    let maxTick = 0
    // Use for loop instead of map/filter to avoid the error `Maximum call stack size exceeded`
    for (const e of events) {
      const tick = isNoteEvent(e) ? e.tick + e.duration : e.tick
      maxTick = Math.max(maxTick, tick)
    }
    return maxTick
  }

  const setControllerValue =
    (controllerType: number, tick: number, value: number) =>
    (events: TickOrderedArray<TrackEvent>) => {
      const e = getLast(
        events
          .getArray()
          .filter(isControllerEventWithType(controllerType))
          .filter(isTickBefore(tick)),
      )
      if (e !== undefined) {
        updateEvent<TrackEventOf<ControllerEvent>>(e.id, {
          value,
        })
      } else {
        // If there are no controller events, we insert new event at the head of the track
        addEvent<TrackEventOf<ControllerEvent>>({
          type: "channel",
          subtype: "controller",
          controllerType,
          tick: 0,
          value,
        })(events)
      }
    }

  export const setVolume =
    (value: number, tick: number) => (events: TickOrderedArray<TrackEvent>) =>
      setControllerValue(7, tick, value)(events)

  export const setPan =
    (value: number, tick: number) => (events: TickOrderedArray<TrackEvent>) =>
      setControllerValue(10, tick, value)(events)

  export const setProgramNumber =
    (value: number) => (events: TickOrderedArray<TrackEvent>) => {
      const e = getProgramNumberEvent(events.getArray())
      if (e !== undefined) {
        updateEvent<TrackEventOf<ProgramChangeEvent>>(e.id, { value })(events)
      } else {
        addEvent<TrackEventOf<ProgramChangeEvent>>({
          ...programChangeMidiEvent(0, 0, value),
          tick: 0,
        })(events)
      }
    }

  export const setTempo =
    (bpm: number, tick: number) => (events: TickOrderedArray<TrackEvent>) => {
      const e = getTempoEvent(events.getArray(), tick)
      const microsecondsPerBeat = Math.floor(bpmToUSecPerBeat(bpm))
      if (e !== undefined) {
        updateEvent<TrackEventOf<SetTempoEvent>>(e.id, {
          microsecondsPerBeat,
        })(events)
      } else {
        addEvent<TrackEventOf<SetTempoEvent>>({
          ...setTempoMidiEvent(0, microsecondsPerBeat),
          tick: 0,
        })(events)
      }
    }

  export const setName =
    (text: string) => (events: TickOrderedArray<TrackEvent>) => {
      const e = getTrackNameEvent(events.getArray())
      if (e !== undefined) {
        updateEvent<TrackEventOf<TrackNameEvent>>(e.id, { text })(events)
      } else {
        addEvent<TrackEventOf<TrackNameEvent>>({
          ...trackNameMidiEvent(0, text),
          tick: 0,
        })(events)
      }
    }

  export const getColorEvent = (
    events: readonly TrackEvent[],
  ): SignalTrackColorEvent | undefined => {
    return events.filter(isSignalTrackColorEvent)[0]
  }

  export const setColor =
    (color: TrackColor | null) => (events: TickOrderedArray<TrackEvent>) => {
      const e = getColorEvent(events.getArray())
      if (color === null) {
        if (e !== undefined) {
          events.remove(e.id)
        }
        return
      }
      if (e !== undefined) {
        updateEvent<SignalTrackColorEvent>(e.id, color)(events)
      } else {
        addEvent<TrackEventOf<SignalTrackColorEvent>>({
          tick: 0,
          type: "channel",
          subtype: "signal",
          signalEventType: "trackColor",
          ...color,
        })(events)
      }
    }
}
