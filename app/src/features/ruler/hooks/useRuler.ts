import { useCallback, useState } from "react"

export function useRuler() {
  const [selectedTimeSignatureEventIds, setSelectedTimeSignatureEventIds] =
    useState<Set<number>>(new Set())

  const selectTimeSignature = useCallback((id: number) => {
    setSelectedTimeSignatureEventIds(new Set([id]))
  }, [])

  const clearSelectedTimeSignature = useCallback(() => {
    setSelectedTimeSignatureEventIds(new Set())
  }, [])

  return {
    selectedTimeSignatureEventIds,
    selectTimeSignature,
    clearSelectedTimeSignature,
  }
}
