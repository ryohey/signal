import { createContext, useCallback, useContext, useMemo } from "react"
import { ControlStore } from "../stores/ControlStore"
export type { SerializedControlStore } from "../stores/ControlStore"
import { useMobxGetter, useMobxSetter } from "./useMobxSelector"
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
    setControlMode: useMobxSetter(controlStore, "controlMode"),
    setControlModes: useMobxSetter(controlStore, "controlModes"),
    setSelection: useMobxSetter(controlStore, "selection"),
    setSelectedEventIds: useMobxSetter(controlStore, "selectedEventIds"),
    serializeState: controlStore.serialize,
    restoreState: controlStore.restore,
  }
}
