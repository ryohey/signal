import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { ControlEventsClipboardData } from "../../clipboard/clipboardTypes"
import { getControllerEventWithType } from "../../event/selectors"
import { TrackEventOf } from "../../event/TrackEvent"
import { getEventsByIds } from "../queries/composed"
import { updateEvent } from "./basic"
import { createOrUpdate, updateOrAdd } from "./composed"
import { combineMutators } from "./higherOrder"
import { TrackEventsMutator } from "./type"

const setControllerValue = (
  controllerType: number,
  tick: number,
  value: number,
): TrackEventsMutator =>
  updateOrAdd<TrackEventOf<ControllerEvent>>(
    getControllerEventWithType(controllerType, tick),
    <TrackEventOf<ControllerEvent>>{
      type: "channel",
      subtype: "controller",
      controllerType,
      tick: 0,
      value,
    },
  )

export const setVolume = (value: number, tick: number): TrackEventsMutator =>
  setControllerValue(7, tick, value)

export const setPan = (value: number, tick: number): TrackEventsMutator =>
  setControllerValue(10, tick, value)

export const createOrUpdateControllerEventsValue =
  <T extends ControllerEvent | PitchBendEvent>(
    selectedEventIds: number[],
    event: T,
    tick: number,
  ): TrackEventsMutator =>
  (events) => {
    const controllerEvents = getEventsByIds(selectedEventIds)(events) ?? []

    if (controllerEvents.length > 0) {
      controllerEvents.forEach((e) =>
        updateEvent(e.id, { value: event.value })(events),
      )
    } else {
      createOrUpdate({
        ...event,
        tick,
      })(events)
    }
  }

export const pasteClipboardDataAtPosition = (
  data: ControlEventsClipboardData,
  position: number,
): TrackEventsMutator =>
  combineMutators(
    ...data.events
      .map((e) => ({ ...e, tick: e.tick + position }))
      .map((e) => createOrUpdate(e)),
  )
