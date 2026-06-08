import { isSetTempoEvent } from "@signal-app/core"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import { transformEvents } from "../components/TempoGraph/transformEvents"
import { useSong } from "./useSong"
import { useTempoEditor } from "./useTempoEditor"
import { useTickScroll } from "./useTickScroll"

const noop = () => () => {}

export function useTempoItems() {
  const { transform } = useTempoEditor()
  const { conductorTrack } = useSong()
  const events = useSyncExternalStore(
    conductorTrack?.onSetTempoEventsChanged.subscribe ?? noop,
    useCallback(
      () => conductorTrack?.getEventsSnapshot() ?? [],
      [conductorTrack],
    ),
  )
  const { canvasWidth, scrollLeft } = useTickScroll()
  const tempoEvents = useMemo(() => events.filter(isSetTempoEvent), [events])
  const items = useMemo(
    () => transformEvents(tempoEvents, transform, canvasWidth + scrollLeft),
    [tempoEvents, transform, canvasWidth, scrollLeft],
  )

  return {
    items,
  }
}
