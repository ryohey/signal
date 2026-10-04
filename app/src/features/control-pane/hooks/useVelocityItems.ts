import { useCallback } from "react"
import { useDerivedValue } from "../../../hooks/useDerivedValue"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { useVelocityEditor } from "./useVelocityEditor"

export function useVelocityItems() {
  const { tickRange } = useTickScroll()
  const velocityEditor = useVelocityEditor()

  return useDerivedValue(
    velocityEditor.observeItems,
    useCallback(
      () => velocityEditor.getNotesInRange(tickRange),
      [velocityEditor, tickRange],
    ),
  )
}
