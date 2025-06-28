import { atom, useAtomValue, useSetAtom } from "jotai"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react"
import { TempoSelection } from "../entities/selection/TempoSelection"
import { TempoCoordTransform } from "../entities/transform/TempoCoordTransform"
import { PianoRollMouseMode } from "../stores/PianoRollStore"
import TempoEditorStore from "../stores/TempoEditorStore"
import { useMobxSelector } from "./useMobxSelector"
import { RulerProvider, useRuler } from "./useRuler"
import { useStores } from "./useStores"
import { TickScrollProvider, useTickScroll } from "./useTickScroll"

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
  const { transform: tickTransform } = useTickScroll(
    tempoEditorStore.tickScrollStore,
  )
  const { beats } = useRuler()

  const selection = useAtomValue(selectionAtom)
  const canvasHeight = useAtomValue(canvasHeightAtom)

  const transform = useMemo(
    () => new TempoCoordTransform(tickTransform, canvasHeight),
    [tickTransform, canvasHeight],
  )

  const selectionRect = useMemo(
    () =>
      selection != null ? TempoSelection.getBounds(selection, transform) : null,
    [selection, transform],
  )

  return {
    selection,
    transform,
    selectionRect,
    beats,
    get cursor() {
      return useAtomValue(cursorAtom)
    },
    get quantizer() {
      return useMobxSelector(
        () => tempoEditorStore.quantizer,
        [tempoEditorStore],
      )
    },
    get selectedEventIds() {
      return useAtomValue(selectedEventIdsAtom)
    },
    get mouseMode() {
      return useAtomValue(mouseModeAtom)
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
    setSelection: useSetAtom(selectionAtom),
    setSelectedEventIds: useSetAtom(selectedEventIdsAtom),
    setMouseMode: useSetAtom(mouseModeAtom),
    setCanvasHeight: useSetAtom(canvasHeightAtom),
    setQuantize: useCallback((quantize: number) => {
      tempoEditorStore.quantize = quantize
    }, []),
    setQuantizeEnabled: useCallback((isEnabled: boolean) => {
      tempoEditorStore.isQuantizeEnabled = isEnabled
    }, []),
  }
}

// atoms

const canvasHeightAtom = atom(0)
const selectionAtom = atom<TempoSelection | null>(null)
const selectedEventIdsAtom = atom<number[]>([])
const mouseModeAtom = atom<PianoRollMouseMode>("pencil")

// derived atoms

const cursorAtom = atom((get) =>
  get(mouseModeAtom) === "pencil"
    ? `url("./cursor-pencil.svg") 0 20, pointer`
    : "auto",
)
