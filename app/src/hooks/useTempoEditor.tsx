import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react"
import { TempoSelection } from "../entities/selection/TempoSelection"
import { PianoRollMouseMode } from "../stores/PianoRollStore"
import TempoEditorStore from "../stores/TempoEditorStore"
import { useMobxSelector } from "./useMobxSelector"
import { RulerProvider, useRuler } from "./useRuler"
import { useStores } from "./useStores"
import { TickScrollProvider } from "./useTickScroll"

const TempoEditorStoreContext = createContext<TempoEditorStore>(null!)

export function TempoEditorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { songStore, player } = useStores()
  const tempoEditorStore = useMemo(
    () => new TempoEditorStore(songStore, player),
    [],
  )

  useEffect(() => {
    tempoEditorStore.setUpAutorun()
  }, [tempoEditorStore])

  return (
    <TempoEditorStoreContext.Provider value={tempoEditorStore}>
      {children}
    </TempoEditorStoreContext.Provider>
  )
}

export function TempoEditorScope({ children }: { children: React.ReactNode }) {
  const { tickScrollStore, rulerStore } = useContext(TempoEditorStoreContext)

  return (
    <TickScrollProvider value={tickScrollStore}>
      <RulerProvider value={rulerStore}>{children}</RulerProvider>
    </TickScrollProvider>
  )
}

export function useTempoEditor() {
  const tempoEditorStore = useContext(TempoEditorStoreContext)

  const selection = useMobxSelector(
    () => tempoEditorStore.selection,
    [tempoEditorStore],
  )
  const { beats } = useRuler()
  const transform = useMobxSelector(
    () => tempoEditorStore.transform,
    [tempoEditorStore],
  )
  const mouseMode = useMobxSelector(
    () => tempoEditorStore.mouseMode,
    [tempoEditorStore],
  )

  const selectionRect = useMemo(
    () =>
      selection != null ? TempoSelection.getBounds(selection, transform) : null,
    [selection, transform],
  )

  const cursor = useMemo(
    () =>
      mouseMode === "pencil"
        ? `url("./cursor-pencil.svg") 0 20, pointer`
        : "auto",
    [mouseMode],
  )

  return {
    selection,
    transform,
    selectionRect,
    beats,
    cursor,
    get quantizer() {
      return useMobxSelector(
        () => tempoEditorStore.quantizer,
        [tempoEditorStore],
      )
    },
    get selectedEventIds() {
      return useMobxSelector(
        () => tempoEditorStore.selectedEventIds,
        [tempoEditorStore],
      )
    },
    get mouseMode() {
      return useMobxSelector(
        () => tempoEditorStore.mouseMode,
        [tempoEditorStore],
      )
    },
    get isQuantizeEnabled() {
      return useMobxSelector(
        () => tempoEditorStore.isQuantizeEnabled,
        [tempoEditorStore],
      )
    },
    get quantize() {
      return useMobxSelector(
        () => tempoEditorStore.quantize,
        [tempoEditorStore],
      )
    },
    setSelection: useCallback((selection: TempoSelection | null) => {
      tempoEditorStore.selection = selection
    }, []),
    setSelectedEventIds: useCallback((ids: number[]) => {
      tempoEditorStore.selectedEventIds = ids
    }, []),
    setMouseMode: useCallback((mode: PianoRollMouseMode) => {
      tempoEditorStore.mouseMode = mode
    }, []),
    setCanvasHeight: useCallback((height: number) => {
      tempoEditorStore.canvasHeight = height
    }, []),
    setQuantize: useCallback((quantize: number) => {
      tempoEditorStore.quantize = quantize
    }, []),
    setQuantizeEnabled: useCallback((isEnabled: boolean) => {
      tempoEditorStore.isQuantizeEnabled = isEnabled
    }, []),
  }
}
