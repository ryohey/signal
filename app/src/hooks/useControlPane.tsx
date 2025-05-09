import { createContext, useCallback, useContext, useMemo } from "react"
import { ControlSelection } from "../entities/selection/ControlSelection"
import {
  ControlMode,
  ControlStore,
  SerializedControlStore,
} from "../stores/ControlStore"
import { useMobxSelector } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"

const ControlStoreContext = createContext<ControlStore>(null!)

export function ControlPaneProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const controlStore = useMemo(() => new ControlStore(), [])

  return (
    <ControlStoreContext.Provider value={controlStore}>
      {children}
    </ControlStoreContext.Provider>
  )
}

export function useControlPane() {
  const controlStore = useContext(ControlStoreContext)

  return {
    get cursor() {
      return usePianoRoll().controlCursor
    },
    get mouseMode() {
      return usePianoRoll().mouseMode
    },
    get controlMode() {
      return useMobxSelector(() => controlStore.controlMode, [controlStore])
    },
    get controlModes() {
      return useMobxSelector(() => controlStore.controlModes, [controlStore])
    },
    get selection() {
      return useMobxSelector(() => controlStore.selection, [controlStore])
    },
    get selectedEventIds() {
      return useMobxSelector(
        () => controlStore.selectedEventIds,
        [controlStore],
      )
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
    serializeState: useCallback(() => controlStore.serialize(), [controlStore]),
    restoreState: useCallback(
      (serializedState: SerializedControlStore) =>
        controlStore.restore(serializedState),
      [controlStore],
    ),
  }
}
