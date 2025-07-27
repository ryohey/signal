import { createContext, useCallback, useContext, useMemo } from "react"
import { ControlSelection } from "../entities/selection/ControlSelection"
import {
  ControlMode,
  ControlStore,
  SerializedControlStore,
} from "../stores/ControlStore"
import { useMobxGetter } from "./useMobxSelector"
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
      return useMobxGetter(controlStore, "controlMode")
    },
    get controlModes() {
      return useMobxGetter(controlStore, "controlModes")
    },
    get selection() {
      return useMobxGetter(controlStore, "selection")
    },
    get selectedEventIds() {
      return useMobxGetter(controlStore, "selectedEventIds")
    },
    get transform() {
      return usePianoRoll().transform
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
