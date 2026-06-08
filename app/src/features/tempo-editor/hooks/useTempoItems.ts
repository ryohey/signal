import { isSetTempoEvent } from "@signal-app/core"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import { useSong } from "../../../hooks/useSong"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { transformEvents } from "../helpers/transformEvents"
import { useTempoTransform } from "./useTempoTransform"

const noop = () => () => {}

export function useTempoItems() {
  const { transform } = useTempoTransform()
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
