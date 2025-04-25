import { maxBy, min, minBy } from "lodash"
import {
  TempoEventsClipboardData,
  isTempoEventsClipboardData,
} from "../clipboard/clipboardTypes"
import { isNotUndefined } from "../helpers/array"
import { useHistory } from "../hooks/useHistory"
import { useSong } from "../hooks/useSong"
import { useStores } from "../hooks/useStores"
import { useTempoEditor } from "../hooks/useTempoEditor"
import clipboard from "../services/Clipboard"
import { isSetTempoEvent } from "../track"

export const useDeleteTempoSelection = () => {
  const song = useSong()
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelection } = useTempoEditor()

  return () => {
    const { conductorTrack } = song
    if (conductorTrack === undefined || selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    // 選択範囲と選択されたノートを削除
    // Remove selected notes and selected notes
    conductorTrack.removeEvents(selectedEventIds)
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
  const song = useSong()
  const { selectedEventIds } = useTempoEditor()

  return () => {
    const { conductorTrack } = song
    if (conductorTrack === undefined || selectedEventIds.length === 0) {
      return
    }

    // Copy selected events
    const events = selectedEventIds
      .map((id) => conductorTrack.getEventById(id))
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
  const { player } = useStores()
  const { conductorTrack } = useSong()
  const { pushHistory } = useHistory()

  return () => {
    if (conductorTrack === undefined) {
      return
    }

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
      tick: e.tick + player.position,
    }))
    conductorTrack.transaction((it) => {
      events.forEach((e) => it.createOrUpdate(e))
    })
  }
}

export const useDuplicateTempoSelection = () => {
  const song = useSong()
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelectedEventIds } = useTempoEditor()

  return () => {
    const { conductorTrack } = song
    if (conductorTrack === undefined || selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    const selectedEvents = selectedEventIds
      .map((id) => conductorTrack.getEventById(id))
      .filter(isNotUndefined)

    // move to the end of selection
    const deltaTick =
      (maxBy(selectedEvents, (e) => e.tick)?.tick ?? 0) -
      (minBy(selectedEvents, (e) => e.tick)?.tick ?? 0)

    const events = selectedEvents.map((note) => ({
      ...note,
      tick: note.tick + deltaTick,
    }))

    const addedEvents = conductorTrack.transaction((it) =>
      events.map((e) => it.createOrUpdate(e)),
    )

    // select the created events
    setSelectedEventIds(addedEvents.map((e) => e.id))
  }
}
