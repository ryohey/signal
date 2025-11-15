import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { Store } from "jotai/vanilla/store"
import { createContext, useCallback, useContext, useMemo } from "react"
import { Point } from "../entities/geometry/Point"
import { TempoSelection } from "../entities/selection/TempoSelection"
import { TempoCoordTransform } from "../entities/transform/TempoCoordTransform"
import { PianoRollMouseMode } from "../stores/PianoRollStore"
import { BeatsProvider, createBeatsScope } from "./useBeats"
import { createQuantizerScope, QuantizerProvider } from "./useQuantizer"
import {
  createTickScrollScope,
  TickScrollProvider,
  useTickScroll,
} from "./useTickScroll"

type TempoEditorStore = {
  quantizerScope: Store
  tickScrollScope: Store
  beatsScope: Store
}

const TempoEditorStoreContext = createContext<TempoEditorStore>(null!)

export function TempoEditorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const store = useStore()

  const tempoEditorStore = useMemo(() => {
    // should match the order in TempoEditorScope
    const tickScrollScope = createTickScrollScope(store)
    const quantizerScope = createQuantizerScope(tickScrollScope)
    const beatsScope = createBeatsScope(quantizerScope)
    return {
      tickScrollScope,
      quantizerScope,
      beatsScope,
    }
  }, [store])

  return (
    <TempoEditorStoreContext.Provider value={tempoEditorStore}>
      {children}
    </TempoEditorStoreContext.Provider>
  )
}

export function TempoEditorScope({ children }: { children: React.ReactNode }) {
  const { tickScrollScope, quantizerScope, beatsScope } = useContext(
    TempoEditorStoreContext,
  )

  return (
    <TickScrollProvider scope={tickScrollScope} minScaleX={0.15} maxScaleX={15}>
      <QuantizerProvider scope={quantizerScope} quantize={4}>
        <BeatsProvider scope={beatsScope}>{children}</BeatsProvider>
      </QuantizerProvider>
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
