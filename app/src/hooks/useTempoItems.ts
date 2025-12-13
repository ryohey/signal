import { useMemo } from "react"
import { transformEvents } from "../components/TempoGraph/transformEvents"
import { useConductorTrack } from "./useConductorTrack"
import { useTempoEditor } from "./useTempoEditor"
import { useTickScroll } from "./useTickScroll"

export function useTempoItems() {
  const { transform } = useTempoEditor()
  const { tempoEvents } = useConductorTrack()
  const { canvasWidth, scrollLeft } = useTickScroll()
  const items = useMemo(
    () => transformEvents(tempoEvents, transform, canvasWidth + scrollLeft),
    [tempoEvents, transform, canvasWidth, scrollLeft]
  )

  return {
    items,
  }
}
