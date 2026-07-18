import {
  ControlEventsClipboardDataSchema,
  createOrUpdateControllerEventsValue,
  duplicateEvents,
  getControlClipboardDataForSelection,
  pasteClipboardDataAtPosition,
} from "@signal-app/core"
import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { useCallback } from "react"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useTrack } from "../../../hooks/useTrack"
import {
  readClipboardData,
  readJSONFromClipboard,
  writeClipboardData,
} from "../../../services/Clipboard"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { useControlPane } from "./useControlPane"

export const useCreateOrUpdateControlEventsValue = () => {
  const { selectedTrackId } = usePianoRoll()
  const mutate = useMutateTrack(selectedTrackId)
  const { position } = usePlayer()
  const { pushHistory } = useHistory()
  const { selectedEventIds } = useControlPane()

  return useCallback(
    <T extends ControllerEvent | PitchBendEvent>(event: T) => {
      pushHistory()

      mutate(
        createOrUpdateControllerEventsValue(selectedEventIds, event, position),
      )
    },
    [selectedEventIds, mutate, position, pushHistory],
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
  const mutate = useMutateTrack(selectedTrackId)

  return useCallback(async () => {
    if (selectedEventIds.length === 0) {
      return
    }
    const data = mutate(getControlClipboardDataForSelection(selectedEventIds))
    if (!data) {
      return
    }

    await writeClipboardData(data)
  }, [selectedEventIds, mutate])
}

export const usePasteControlSelection = () => {
  const { selectedTrackId } = usePianoRoll()
  const { position } = usePlayer()
  const { pushHistory } = useHistory()
  const mutate = useMutateTrack(selectedTrackId)

  return useCallback(
    async (e?: ClipboardEvent) => {
      const obj = e ? readJSONFromClipboard(e) : await readClipboardData()
      const { data } = ControlEventsClipboardDataSchema.safeParse(obj)

      if (!data) {
        return
      }

      pushHistory()
      mutate(pasteClipboardDataAtPosition(data, position))
    },
    [mutate, position, pushHistory],
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
  const mutate = useMutateTrack(selectedTrackId)

  return useCallback(() => {
    if (selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    // select the created events
    const addedEventIds = mutate(duplicateEvents(selectedEventIds)) ?? []
    setSelectedEventIds(addedEventIds)
  }, [selectedEventIds, pushHistory, setSelectedEventIds, mutate])
}
