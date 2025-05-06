import { maxBy, min, minBy } from "lodash"
import { transaction } from "mobx"
import {
  TempoEventsClipboardData,
  isTempoEventsClipboardData,
} from "../clipboard/clipboardTypes"
import { isNotUndefined } from "../helpers/array"
import { useConductorTrack } from "../hooks/useConductorTrack"
import { useHistory } from "../hooks/useHistory"
import { usePlayer } from "../hooks/usePlayer"
import { useTempoEditor } from "../hooks/useTempoEditor"
import clipboard from "../services/Clipboard"
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

  return () => {
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

    clipboard.writeText(JSON.stringify(data))
  }
}

export const usePasteTempoSelection = () => {
  const { position } = usePlayer()
  const { createOrUpdate } = useConductorTrack()
  const { pushHistory } = useHistory()

  return () => {
    const text = clipboard.readText()
    if (!text || text.length === 0) {
      return
    }

    const obj = JSON.parse(text)
    if (!isTempoEventsClipboardData(obj)) {
      return
    }

    pushHistory()

    const events = obj.events.map((e) => ({
      ...e,
      tick: e.tick + position,
    }))
    transaction(() => {
      events.forEach(createOrUpdate)
    })
  }
}

export const useDuplicateTempoSelection = () => {
  const { getEventById, createOrUpdate } = useConductorTrack()
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelectedEventIds } = useTempoEditor()

  return () => {
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

    const events = selectedEvents.map((note) => ({
      ...note,
      tick: note.tick + deltaTick,
    }))

    const addedEvents = transaction(() => events.map(createOrUpdate)).filter(
      isNotUndefined,
    )

    // select the created events
    setSelectedEventIds(addedEvents.map((e) => e.id))
  }
}
