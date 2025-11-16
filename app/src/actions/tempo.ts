import { min } from "lodash"
import { transaction } from "mobx"
import { useCallback } from "react"
import {
  TempoEventsClipboardData,
  TempoEventsClipboardDataSchema,
} from "../clipboard/clipboardTypes"
import { isNotUndefined } from "../helpers/array"
import { useCommands } from "../hooks/useCommands"
import { useConductorTrack } from "../hooks/useConductorTrack"
import { useHistory } from "../hooks/useHistory"
import { usePlayer } from "../hooks/usePlayer"
import { useTempoEditor } from "../hooks/useTempoEditor"
import {
  readClipboardData,
  readJSONFromClipboard,
  writeClipboardData,
} from "../services/Clipboard"
import { isSetTempoEvent } from "../track"

export const useDeleteTempoSelection = () => {
  const { removeEvents } = useConductorTrack()
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelection } = useTempoEditor()

  return () => {
    if (selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    // 選択範囲と選択されたノートを削除
    // Remove selected notes and selected notes
    removeEvents(selectedEventIds)
    setSelection(null)
  }
}

export const useResetTempoSelection = () => {
  const { setSelection, setSelectedEventIds } = useTempoEditor()

  return () => {
    setSelection(null)
    setSelectedEventIds([])
  }
}

export const useCopyTempoSelection = () => {
  const { selectedEventIds } = useTempoEditor()
  const { getEventById } = useConductorTrack()

  return async () => {
    if (selectedEventIds.length === 0) {
      return
    }

    // Copy selected events
    const events = selectedEventIds
      .map(getEventById)
      .filter(isNotUndefined)
      .filter(isSetTempoEvent)

    const minTick = min(events.map((e) => e.tick))

    if (minTick === undefined) {
      return
    }

    const relativePositionedEvents = events.map((note) => ({
      ...note,
      tick: note.tick - minTick,
    }))

    const data: TempoEventsClipboardData = {
      type: "tempo_events",
      events: relativePositionedEvents,
    }

    await writeClipboardData(data)
  }
}

export const usePasteTempoSelection = () => {
  const { position } = usePlayer()
  const { createOrUpdate } = useConductorTrack()
  const { pushHistory } = useHistory()

  return async (e?: ClipboardEvent) => {
    const obj = e ? readJSONFromClipboard(e) : await readClipboardData()
    const { data } = TempoEventsClipboardDataSchema.safeParse(obj)

    if (!data) {
      return
    }

    pushHistory()

    const events = data.events.map((e) => ({
      ...e,
      tick: e.tick + position,
    }))
    transaction(() => {
      events.forEach(createOrUpdate)
    })
  }
}

export const useCutTempoSelection = () => {
  const copyTempoSelection = useCopyTempoSelection()
  const deleteTempoSelection = useDeleteTempoSelection()

  return useCallback(() => {
    copyTempoSelection()
    deleteTempoSelection()
  }, [copyTempoSelection, deleteTempoSelection])
}

export const useDuplicateTempoSelection = () => {
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelectedEventIds } = useTempoEditor()
  const commands = useCommands()

  return () => {
    if (selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    const addedEvents =
      commands.conductorTrack.duplicateEvents(selectedEventIds)

    // select the created events
    setSelectedEventIds(addedEvents.map((e) => e.id))
  }
}
