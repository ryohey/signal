import { isEventInRange } from "@signal-app/core"
import { useMemo } from "react"
import { useDerivedValue } from "../../../hooks/useDerivedValue"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { useRulerEditor } from "./useRulerEditor"

export interface RulerTimeSignature {
  id: number
  x: number
  denominator: number
  numerator: number
  isSelected: boolean
}

function useTimeSignatureItems() {
  const { getTimeSignatures, observeTimeSignatures } = useRulerEditor()
  return useDerivedValue(observeTimeSignatures, getTimeSignatures)
}

export function useTimeSignatures({
  selectedTimeSignatureEventIds,
}: {
  selectedTimeSignatureEventIds: Set<number>
}) {
  const timeSignatures = useTimeSignatureItems()
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
