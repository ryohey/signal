import { ControlEventsClipboardDataSchema } from "@signal-app/core"
import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { useCallback } from "react"
import { isNotUndefined } from "../helpers/array"
import { useCommands } from "../hooks/useCommands"
import { useControlPane } from "../hooks/useControlPane"
import { useHistory } from "../hooks/useHistory"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { useTrack } from "../hooks/useTrack"
import {
  readClipboardData,
  readJSONFromClipboard,
  writeClipboardData,
} from "../services/Clipboard"

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
  const { selectedEventIds } = useControlPane()
  const commands = useCommands()

  return useCallback(async () => {
    if (selectedEventIds.length === 0) {
      return
    }
    const data = commands.control.getClipboardDataForSelection(
      selectedTrackId,
      selectedEventIds,
    )
    if (!data) {
      return
    }

    await writeClipboardData(data)
  }, [selectedEventIds, commands, selectedTrackId])
}

export const usePasteControlSelection = () => {
  const { selectedTrackId } = usePianoRoll()
  const { position } = usePlayer()
  const { pushHistory } = useHistory()
  const commands = useCommands()

  return useCallback(
    async (e?: ClipboardEvent) => {
      const obj = e ? readJSONFromClipboard(e) : await readClipboardData()
      const { data } = ControlEventsClipboardDataSchema.safeParse(obj)

      if (!data) {
        return
      }

      pushHistory()
      commands.control.pasteClipboardDataAtPosition(
        selectedTrackId,
        data,
        position,
      )
    },
    [commands, position, pushHistory, selectedTrackId],
  )
}

export const useCutControlSelection = () => {
  const copyControlSelection = useCopyControlSelection()
  const deleteControlSelection = useDeleteControlSelection()

  return useCallback(() => {
    copyControlSelection()
    deleteControlSelection()
  }, [copyControlSelection, deleteControlSelection])
}

export const useDuplicateControlSelection = () => {
  const { selectedTrackId } = usePianoRoll()
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelectedEventIds } = useControlPane()
  const commands = useCommands()

  return useCallback(() => {
    if (selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    // select the created events
    const addedEventIds = commands.track.duplicateEvents(
      selectedTrackId,
      selectedEventIds,
    )
    setSelectedEventIds(addedEventIds)
  }, [
    selectedEventIds,
    pushHistory,
    setSelectedEventIds,
    commands,
    selectedTrackId,
  ])
}
