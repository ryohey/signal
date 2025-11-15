import { atom, useAtomValue, useSetAtom } from "jotai"
import { createContext, useCallback, useContext, useMemo } from "react"
import { Point } from "../entities/geometry/Point"
import { TempoSelection } from "../entities/selection/TempoSelection"
import { TempoCoordTransform } from "../entities/transform/TempoCoordTransform"
import { PianoRollMouseMode } from "../stores/PianoRollStore"
import QuantizerStore from "../stores/QuantizerStore"
import { TickScrollStore } from "../stores/TickScrollStore"
import { BeatsProvider } from "./useBeats"
import { QuantizerProvider } from "./useQuantizer"
import { useStores } from "./useStores"
import { TickScrollProvider, useTickScroll } from "./useTickScroll"

type TempoEditorStore = {
  tickScrollStore: TickScrollStore
  quantizerStore: QuantizerStore
}

const TempoEditorStoreContext = createContext<TempoEditorStore>(null!)

export function TempoEditorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { songStore, player } = useStores()

  const tempoEditorStore = useMemo(() => {
    const tickScrollStore = new TickScrollStore(songStore, player, 0.15, 15)
    const quantizerStore = new QuantizerStore(songStore)
    return { tickScrollStore, quantizerStore }
  }, [player, songStore])

  return (
    <TempoEditorStoreContext.Provider value={tempoEditorStore}>
      {children}
    </TempoEditorStoreContext.Provider>
  )
}

export function TempoEditorScope({ children }: { children: React.ReactNode }) {
  const { tickScrollStore, quantizerStore } = useContext(
    TempoEditorStoreContext,
  )

  return (
    <TickScrollProvider value={tickScrollStore}>
      <BeatsProvider>
        <QuantizerProvider value={quantizerStore}>{children}</QuantizerProvider>
      </BeatsProvider>
    </TickScrollProvider>
  )
}

export function useTempoEditor() {
  const { tickScrollStore } = useContext(TempoEditorStoreContext)

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
    getLocal: useCallback(
      (e: { offsetX: number; offsetY: number }): Point => ({
        x: e.offsetX + tickScrollStore.scrollLeft,
        y: e.offsetY,
      }),
      [tickScrollStore],
    ),
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
