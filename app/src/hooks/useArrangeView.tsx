import { createContext, useCallback, useContext, useMemo } from "react"
import ArrangeViewStore from "../stores/ArrangeViewStore"
import { useMobxGetter, useMobxSetter } from "./useMobxSelector"
import { QuantizerProvider } from "./useQuantizer"
import { RulerProvider } from "./useRuler"
import { useStores } from "./useStores"
import { TickScrollProvider, useTickScroll } from "./useTickScroll"
import { TrackScrollProvider, useTrackScroll } from "./useTrackScroll"
export type { ArrangeSelection } from "../entities/selection/ArrangeSelection"
export type { SerializedArrangeViewStore } from "../stores/ArrangeViewStore"

const ArrangeViewStoreContext = createContext<ArrangeViewStore>(null!)

export function ArrangeViewProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { songStore, player } = useStores()
  const arrangeViewStore = useMemo(
    () => new ArrangeViewStore(songStore, player),
    [songStore, player],
  )

  return (
    <ArrangeViewStoreContext.Provider value={arrangeViewStore}>
      {children}
    </ArrangeViewStoreContext.Provider>
  )
}

export function ArrangeViewScope({ children }: { children: React.ReactNode }) {
  const { tickScrollStore, trackScrollStore, rulerStore, quantizerStore } =
    useContext(ArrangeViewStoreContext)

  return (
    <TickScrollProvider value={tickScrollStore}>
      <TrackScrollProvider value={trackScrollStore}>
        <RulerProvider value={rulerStore}>
          <QuantizerProvider value={quantizerStore}>
            {children}
          </QuantizerProvider>
        </RulerProvider>
      </TrackScrollProvider>
    </TickScrollProvider>
  )
}

export function useArrangeView() {
  const arrangeViewStore = useContext(ArrangeViewStoreContext)
  const { tickScrollStore, trackScrollStore } = arrangeViewStore
  const { setScrollLeftInPixels } = useTickScroll(tickScrollStore)
  const { setScrollTop } = useTrackScroll(trackScrollStore)

  return {
    get notes() {
      return useMobxGetter(arrangeViewStore, "notes")
    },
    get transform() {
      return useMobxGetter(arrangeViewStore, "transform")
    },
    get selectedTrackIndex() {
      return useMobxGetter(arrangeViewStore, "selectedTrackIndex")
    },
    get selectedTrackId() {
      return useMobxGetter(arrangeViewStore, "selectedTrackId")
    },
    get selection() {
      return useMobxGetter(arrangeViewStore, "selection")
    },
    get selectionRect() {
      return useMobxGetter(arrangeViewStore, "selectionRect")
    },
    get selectedEventIds() {
      return useMobxGetter(arrangeViewStore, "selectedEventIds")
    },
    get trackTransform() {
      return useMobxGetter(arrangeViewStore, "trackTransform")
    },
    get openTransposeDialog() {
      return useMobxGetter(arrangeViewStore, "openTransposeDialog")
    },
    get openVelocityDialog() {
      return useMobxGetter(arrangeViewStore, "openVelocityDialog")
    },
    rulerStore: arrangeViewStore.rulerStore,
    scrollBy: useCallback(
      (x: number, y: number) => {
        setScrollLeftInPixels(tickScrollStore.scrollLeft - x)
        setScrollTop(trackScrollStore.scrollTop - y)
      },
      [setScrollLeftInPixels, setScrollTop, tickScrollStore, trackScrollStore],
    ),
    setSelectedTrackIndex: useMobxSetter(
      arrangeViewStore,
      "selectedTrackIndex",
    ),
    setSelection: useMobxSetter(arrangeViewStore, "selection"),
    setSelectedEventIds: useMobxSetter(arrangeViewStore, "selectedEventIds"),
    resetSelection: useCallback(() => {
      arrangeViewStore.selection = null
      arrangeViewStore.selectedEventIds = {}
    }, [arrangeViewStore]),
    setOpenTransposeDialog: useMobxSetter(
      arrangeViewStore,
      "openTransposeDialog",
    ),
    setOpenVelocityDialog: useMobxSetter(
      arrangeViewStore,
      "openVelocityDialog",
    ),
    serializeState: arrangeViewStore.serialize,
    restoreState: arrangeViewStore.restore,
  }
}
