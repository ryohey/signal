import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { Store } from "jotai/vanilla/store"
import { createContext, useCallback, useContext, useMemo } from "react"
import { Point } from "../entities/geometry/Point"
import { TempoSelection } from "../entities/selection/TempoSelection"
import { TempoCoordTransform } from "../entities/transform/TempoCoordTransform"
import { PianoRollMouseMode } from "../stores/PianoRollStore"
import QuantizerStore from "../stores/QuantizerStore"
import { BeatsProvider } from "./useBeats"
import { QuantizerProvider } from "./useQuantizer"
import { useStores } from "./useStores"
import {
  createTickScrollScope,
  TickScrollProvider,
  useTickScroll,
} from "./useTickScroll"

type TempoEditorStore = {
  quantizerStore: QuantizerStore
  tickScrollScope: Store
}

const TempoEditorStoreContext = createContext<TempoEditorStore>(null!)

export function TempoEditorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { songStore } = useStores()
  const store = useStore()

  const tempoEditorStore = useMemo(() => {
    const quantizerStore = new QuantizerStore(songStore)
    const tickScrollScope = createTickScrollScope(store)
    return { quantizerStore, tickScrollScope }
  }, [songStore, store])

  return (
    <TempoEditorStoreContext.Provider value={tempoEditorStore}>
      {children}
    </TempoEditorStoreContext.Provider>
  )
}

export function TempoEditorScope({ children }: { children: React.ReactNode }) {
  const { tickScrollScope, quantizerStore } = useContext(
    TempoEditorStoreContext,
  )

  return (
    <TickScrollProvider scope={tickScrollScope} minScaleX={0.15} maxScaleX={15}>
      <BeatsProvider>
        <QuantizerProvider value={quantizerStore}>{children}</QuantizerProvider>
      </BeatsProvider>
    </TickScrollProvider>
  )
}

export function useTempoEditor() {
  const { tickScrollScope } = useContext(TempoEditorStoreContext)

  return {
    get selection() {
      return useAtomValue(selectionAtom)
    },
    get transform() {
      // WANTFIX: Use derived atom to create TempoCoordTransform
      const { transform: tickTransform } = useTickScroll()
      const canvasHeight = useAtomValue(canvasHeightAtom)
      return useMemo(
        () => new TempoCoordTransform(tickTransform, canvasHeight),
        [tickTransform, canvasHeight],
      )
    },
    get selectedEventIds() {
      return useAtomValue(selectedEventIdsAtom)
    },
    get mouseMode() {
      return useAtomValue(mouseModeAtom)
    },
    // convert mouse position to the local coordinate on the canvas
    get getLocal() {
      const { scrollLeft } = useTickScroll(tickScrollScope)
      return useCallback(
        (e: { offsetX: number; offsetY: number }): Point => ({
          x: e.offsetX + scrollLeft,
          y: e.offsetY,
        }),
        [scrollLeft],
      )
    },
    setSelection: useSetAtom(selectionAtom),
    setSelectedEventIds: useSetAtom(selectedEventIdsAtom),
    setMouseMode: useSetAtom(mouseModeAtom),
    setCanvasHeight: useSetAtom(canvasHeightAtom),
  }
}

// atoms
const canvasHeightAtom = atom(0)
const mouseModeAtom = atom<PianoRollMouseMode>("pencil")
const selectionAtom = atom<TempoSelection | null>(null)
const selectedEventIdsAtom = atom<number[]>([])
