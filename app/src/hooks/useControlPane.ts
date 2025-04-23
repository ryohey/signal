import { useCallback } from "react"
import { ControlSelection } from "../entities/selection/ControlSelection"
import { ControlMode } from "../stores/ControlStore"
import { useMobxSelector, useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useControlPane() {
  const { controlStore } = useStores()
  const { rulerStore } = controlStore

  const cursor = useMobxStore(({ controlStore }) => controlStore.cursor)
  const mouseMode = useMobxStore(({ controlStore }) => controlStore.mouseMode)
  const controlMode = useMobxStore(
    ({ controlStore }) => controlStore.controlMode,
  )
  const controlModes = useMobxStore(
    ({ controlStore }) => controlStore.controlModes,
  )
  const selection = useMobxStore(({ controlStore }) => controlStore.selection)
  const selectedEventIds = useMobxStore(
    ({ controlStore }) => controlStore.selectedEventIds,
  )
  const controlValueEvents = useMobxStore(
    ({ controlStore }) => controlStore.controlValueEvents,
  )
  const scrollLeft = useMobxStore(({ controlStore }) => controlStore.scrollLeft)
  const cursorX = useMobxStore(({ controlStore }) => controlStore.cursorX)
  const transform = useMobxStore(({ controlStore }) => controlStore.transform)
  const quantizer = useMobxStore(({ controlStore }) => controlStore.quantizer)
  const beats = useMobxSelector(() => rulerStore.beats, [rulerStore])

  return {
    cursor,
    mouseMode,
    controlMode,
    controlModes,
    selection,
    selectedEventIds,
    controlValueEvents,
    scrollLeft,
    cursorX,
    transform,
    beats,
    quantizer,
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
