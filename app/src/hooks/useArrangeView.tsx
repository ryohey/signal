import { atom, useAtomValue, useSetAtom } from "jotai"
import { cloneDeep } from "lodash"
import { createContext, useCallback, useContext, useMemo } from "react"
import { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import ArrangeViewStore from "../stores/ArrangeViewStore"
import { useMobxGetter, useMobxSelector } from "./useMobxSelector"
import { QuantizerProvider } from "./useQuantizer"
import { RulerProvider } from "./useRuler"
import { useStores } from "./useStores"
import { TickScrollProvider, useTickScroll } from "./useTickScroll"
import { TrackScrollProvider, useTrackScroll } from "./useTrackScroll"
export type { ArrangeSelection } from "../entities/selection/ArrangeSelection"

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
  const { songStore } = useStores()
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
      return useAtomValue(selectedTrackIndexAtom)
    },
    get selectedTrackId() {
      const selectedTrackIndex = useAtomValue(selectedTrackIndexAtom)
      return useMobxSelector(
        () => songStore.song.tracks[selectedTrackIndex]?.id,
        [songStore, selectedTrackIndex],
      )
    },
    get selection() {
      return useAtomValue(selectionAtom)
    },
    get selectedEventIds() {
      return useAtomValue(selectedEventIdsAtom)
    },
    get trackTransform() {
      return useMobxGetter(arrangeViewStore, "trackTransform")
    },
    get openTransposeDialog() {
      return useAtomValue(openTransposeDialogAtom)
    },
    get openVelocityDialog() {
      return useAtomValue(openVelocityDialogAtom)
    },
    rulerStore: arrangeViewStore.rulerStore,
    scrollBy: useCallback(
      (x: number, y: number) => {
        setScrollLeftInPixels(tickScrollStore.scrollLeft - x)
        setScrollTop(trackScrollStore.scrollTop - y)
      },
      [setScrollLeftInPixels, setScrollTop, tickScrollStore, trackScrollStore],
    ),
    setSelectedTrackIndex: useSetAtom(selectedTrackIndexAtom),
    setSelection: useSetAtom(selectionAtom),
    setSelectedEventIds: useSetAtom(selectedEventIdsAtom),
    resetSelection: useSetAtom(resetSelectionAtom),
    setOpenTransposeDialog: useSetAtom(openTransposeDialogAtom),
    setOpenVelocityDialog: useSetAtom(openVelocityDialogAtom),
    serializeState: useSetAtom(serializeAtom),
    restoreState: useSetAtom(restoreAtom),
  }
}

// atoms
const selectionAtom = atom<ArrangeSelection | null>(null)
const selectedEventIdsAtom = atom<{ [trackIndex: number]: number[] }>({})
const selectedTrackIndexAtom = atom(0)
const openTransposeDialogAtom = atom(false)
const openVelocityDialogAtom = atom(false)

// actions
const resetSelectionAtom = atom(null, (_get, set) => {
  set(selectionAtom, null)
  set(selectedEventIdsAtom, {})
})
const serializeAtom = atom(null, (get) => ({
  selection: cloneDeep(get(selectionAtom)),
  selectedEventIds: cloneDeep(get(selectedEventIdsAtom)),
}))
const restoreAtom = atom(
  null,
  (
    _get,
    set,
    {
      selection,
      selectedEventIds,
    }: {
      selection: ArrangeSelection | null
      selectedEventIds: { [trackIndex: number]: number[] }
    },
  ) => {
    set(selectionAtom, selection)
    set(selectedEventIdsAtom, selectedEventIds)
  },
)
