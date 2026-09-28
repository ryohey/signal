import { isEventInRange } from "@signal-app/core"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import { useSong } from "../../../hooks/useSong"
import { useTickScroll } from "../../../hooks/useTickScroll"

export interface RulerTimeSignature {
  id: number
  x: number
  denominator: number
  numerator: number
  isSelected: boolean
}

const noop = () => () => {}

function useTimeSignatureEvents() {
  const { conductorTrack } = useSong()
  return useSyncExternalStore(
    conductorTrack?.onTimeSignatureEventsChanged.subscribe ?? noop,
    useCallback(
      () => conductorTrack?.timeSignatureEvents ?? [],
      [conductorTrack],
    ),
  )
}

export function useTimeSignatures({
  selectedTimeSignatureEventIds,
}: {
  selectedTimeSignatureEventIds: Set<number>
}) {
  const timeSignatures = useTimeSignatureEvents()
  const { transform, tickRange } = useTickScroll()

  return useMemo(() => {
    return timeSignatures.filter(isEventInRange(tickRange)).map((e) => {
      const x = transform.getX(e.tick)
      return {
        id: e.id,
        x,
        numerator: e.numerator,
        denominator: e.denominator,
        isSelected: selectedTimeSignatureEventIds.has(e.id),
      }
    })
  }, [transform, selectedTimeSignatureEventIds, timeSignatures, tickRange])
}
