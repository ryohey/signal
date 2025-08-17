import { maxBy, min, minBy } from "lodash"
import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { transaction } from "mobx"
import { useCallback } from "react"
import {
  ControlEventsClipboardData,
  ControlEventsClipboardDataSchema,
} from "../clipboard/clipboardTypes"
import { isNotUndefined } from "../helpers/array"
import { useControlPane } from "../hooks/useControlPane"
import { useHistory } from "../hooks/useHistory"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { useTrack } from "../hooks/useTrack"
import { readClipboardData, writeClipboardData } from "../services/Clipboard"

export const useCreateOrUpdateControlEventsValue = () => {
  const { selectedTrackId } = usePianoRoll()
  const { getEventById, updateEvent, createOrUpdate } =
    useTrack(selectedTrackId)
  const { position } = usePlayer()
  const { pushHistory } = useHistory()
  const { selectedEventIds } = useControlPane()

  return useCallback(
    <T extends ControllerEvent | PitchBendEvent>(event: T) => {
      pushHistory()

      const controllerEvents = selectedEventIds
        .map((id) => getEventById(id))
        .filter(isNotUndefined)

      if (controllerEvents.length > 0) {
        controllerEvents.forEach((e) =>
          updateEvent(e.id, { value: event.value }),
        )
      } else {
        createOrUpdate({
          ...event,
          tick: position,
        })
      }
    },
    [
      selectedEventIds,
      getEventById,
      updateEvent,
      createOrUpdate,
      position,
      pushHistory,
    ],
  )
}

export const useDeleteControlSelection = () => {
  const { selectedTrackId } = usePianoRoll()
  const { removeEvents } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelection } = useControlPane()

  return useCallback(() => {
    if (selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    // Remove selected notes and selected notes
    removeEvents(selectedEventIds)
    setSelection(null)
  }, [selectedEventIds, removeEvents, pushHistory, setSelection])
}

export const useCopyControlSelection = () => {
  const { selectedTrackId } = usePianoRoll()
  const { getEventById } = useTrack(selectedTrackId)
  const { selectedEventIds } = useControlPane()

  return useCallback(async () => {
    if (selectedEventIds.length === 0) {
      return
    }

    // Copy selected events
    const events = selectedEventIds
      .map((id) => getEventById(id))
      .filter(isNotUndefined)

    const minTick = min(events.map((e) => e.tick))

    if (minTick === undefined) {
      return
    }

    const relativePositionedEvents = events.map((note) => ({
      ...note,
      tick: note.tick - minTick,
    }))

    const data: ControlEventsClipboardData = {
      type: "control_events",
      events: relativePositionedEvents,
    }

    await writeClipboardData(data)
  }, [selectedEventIds, getEventById])
}

export const usePasteControlSelection = () => {
  const { selectedTrackId } = usePianoRoll()
  const { createOrUpdate } = useTrack(selectedTrackId)
  const { position } = usePlayer()
  const { pushHistory } = useHistory()

  return useCallback(
    async (clipboardData?: any) => {
      const obj = clipboardData ?? (await readClipboardData())
      const { data } = ControlEventsClipboardDataSchema.safeParse(obj)

      if (!data) {
        return
      }

      pushHistory()

      const events = data.events.map((e) => ({
        ...e,
        tick: e.tick + position,
      }))
      transaction(() => events.forEach(createOrUpdate))
    },
    [createOrUpdate, position, pushHistory],
  )
}

export const useDuplicateControlSelection = () => {
  const { selectedTrackId } = usePianoRoll()
  const { getEventById, createOrUpdate } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelectedEventIds } = useControlPane()

  return useCallback(() => {
    if (selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    const selectedEvents = selectedEventIds
      .map((id) => getEventById(id))
      .filter(isNotUndefined)

    // move to the end of selection
    const deltaTick =
      (maxBy(selectedEvents, (e) => e.tick)?.tick ?? 0) -
      (minBy(selectedEvents, (e) => e.tick)?.tick ?? 0)

    const notes = selectedEvents.map((note) => ({
      ...note,
      tick: note.tick + deltaTick,
    }))

    // select the created events
    const addedEvents = transaction(() => notes.map(createOrUpdate)).filter(
      isNotUndefined,
    )
    setSelectedEventIds(addedEvents.map((e) => e.id))
  }, [
    selectedEventIds,
    getEventById,
    createOrUpdate,
    pushHistory,
    setSelectedEventIds,
  ])
}
