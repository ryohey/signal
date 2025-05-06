import { useCallback } from "react"
import { ControlSelection } from "../entities/selection/ControlSelection"
import { ControlMode } from "../stores/ControlStore"
import { useMobxStore } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"
import { useStores } from "./useStores"

export function useControlPane() {
  const { controlStore } = useStores()

  return {
    get cursor() {
      return usePianoRoll().controlCursor
    },
    get mouseMode() {
      return usePianoRoll().mouseMode
    },
    get controlMode() {
      return useMobxStore(({ controlStore }) => controlStore.controlMode)
    },
    get controlModes() {
      return useMobxStore(({ controlStore }) => controlStore.controlModes)
    },
    get selection() {
      return useMobxStore(({ controlStore }) => controlStore.selection)
    },
    get selectedEventIds() {
      return useMobxStore(({ controlStore }) => controlStore.selectedEventIds)
    },
    get transform() {
      return usePianoRoll().transform
    },
    get quantizer() {
      return usePianoRoll().quantizer
    },
    resetSelection: useCallback(() => {
      controlStore.selection = null
      controlStore.selectedEventIds = []
    }, []),
    setControlMode: useCallback((controlMode: ControlMode) => {
      controlStore.controlMode = controlMode
    }, []),
    setControlModes: useCallback((controlModes: ControlMode[]) => {
      controlStore.controlModes = controlModes
    }, []),
    setSelection: useCallback((selection: ControlSelection | null) => {
      controlStore.selection = selection
    }, []),
    setSelectedEventIds: useCallback((selectedEventIds: number[]) => {
      controlStore.selectedEventIds = selectedEventIds
    }, []),
  }
}
