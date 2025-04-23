import { maxBy, min, minBy } from "lodash"
import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import {
  ControlEventsClipboardData,
  isControlEventsClipboardData,
} from "../clipboard/clipboardTypes"
import { isNotUndefined } from "../helpers/array"
import { useControlPane } from "../hooks/useControlPane"
import { useStores } from "../hooks/useStores"
import clipboard from "../services/Clipboard"

export const useCreateOrUpdateControlEventsValue = () => {
  const {
    pianoRollStore: { selectedTrack },
    player,
    pushHistory,
  } = useStores()
  const { selectedEventIds } = useControlPane()

  return <T extends ControllerEvent | PitchBendEvent>(event: T) => {
    if (selectedTrack === undefined) {
      return
    }

    pushHistory()

    const controllerEvents = selectedEventIds
      .map((id) => selectedTrack.getEventById(id))
      .filter(isNotUndefined)

    if (controllerEvents.length > 0) {
      controllerEvents.forEach((e) =>
        selectedTrack.updateEvent(e.id, { value: event.value }),
      )
    } else {
      selectedTrack.createOrUpdate({
        ...event,
        tick: player.position,
      })
    }
  }
}

export const useDeleteControlSelection = () => {
  const {
    pianoRollStore: { selectedTrack },
    pushHistory,
  } = useStores()
  const { selectedEventIds, setSelection } = useControlPane()

  return () => {
    if (selectedTrack === undefined || selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    // Remove selected notes and selected notes
    selectedTrack.removeEvents(selectedEventIds)
    setSelection(null)
  }
}

export const useCopyControlSelection = () => {
  const {
    pianoRollStore: { selectedTrack },
  } = useStores()
  const { selectedEventIds } = useControlPane()

  return () => {
    if (selectedTrack === undefined || selectedEventIds.length === 0) {
      return
    }

    // Copy selected events
    const events = selectedEventIds
      .map((id) => selectedTrack.getEventById(id))
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

    clipboard.writeText(JSON.stringify(data))
  }
}

export const usePasteControlSelection = () => {
  const {
    pianoRollStore: { selectedTrack },
    player,
    pushHistory,
  } = useStores()

  return () => {
    if (selectedTrack === undefined) {
      return
    }

    const text = clipboard.readText()
    if (!text || text.length === 0) {
      return
    }

    const obj = JSON.parse(text)
    if (!isControlEventsClipboardData(obj)) {
      return
    }

    pushHistory()

    const events = obj.events.map((e) => ({
      ...e,
      tick: e.tick + player.position,
    }))
    selectedTrack.transaction((it) =>
      events.forEach((e) => it.createOrUpdate(e)),
    )
  }
}

export const useDuplicateControlSelection = () => {
  const {
    pianoRollStore: { selectedTrack },
    pushHistory,
  } = useStores()
  const { selectedEventIds, setSelectedEventIds } = useControlPane()

  return () => {
    if (selectedTrack === undefined || selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    const selectedEvents = selectedEventIds
      .map((id) => selectedTrack.getEventById(id))
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
    const addedEvents = selectedTrack.transaction((it) =>
      notes.map((e) => it.createOrUpdate(e)),
    )
    setSelectedEventIds(addedEvents.map((e) => e.id))
  }
}
