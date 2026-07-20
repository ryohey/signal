import { filter, isSetTempoEvent, UNASSIGNED_TRACK_ID } from "@signal-app/core"
import { useMemo } from "react"
import { useSong } from "../../../hooks/useSong"
import { useSyncTrackQuery } from "../../../hooks/useSyncTrackQuery"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { transformEvents } from "../helpers/transformEvents"
import { useTempoTransform } from "./useTempoTransform"

const filterSetTempoEvent = filter(isSetTempoEvent)

export function useTempoItems() {
  const { transform } = useTempoTransform()
  const { conductorTrack } = useSong()
  const tempoEvents =
    useSyncTrackQuery(
      conductorTrack?.id ?? UNASSIGNED_TRACK_ID,
      filterSetTempoEvent,
      isSetTempoEvent,
    ) ?? []
  const { canvasWidth, scrollLeft } = useTickScroll()
  const items = useMemo(
    () => transformEvents(tempoEvents, transform, canvasWidth + scrollLeft),
    [tempoEvents, transform, canvasWidth, scrollLeft],
  )

  return {
    items,
  }
}
