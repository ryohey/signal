import { atom, useAtomValue, useSetAtom } from "jotai"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react"
import { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import ArrangeViewStore, {
  SerializedArrangeViewStore,
} from "../stores/ArrangeViewStore"
import { useMobxSelector } from "./useMobxSelector"
import { RulerProvider } from "./useRuler"
import { useStores } from "./useStores"
import { TickScrollProvider, useTickScroll } from "./useTickScroll"
import { TrackScrollProvider, useTrackScroll } from "./useTrackScroll"

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

  useEffect(() => {
    arrangeViewStore.setUpAutorun()
  }, [arrangeViewStore])

  return (
    <ArrangeViewStoreContext.Provider value={arrangeViewStore}>
      {children}
    </ArrangeViewStoreContext.Provider>
  )
}

export function ArrangeViewScope({ children }: { children: React.ReactNode }) {
  const { tickScrollStore, trackScrollStore, rulerStore } = useContext(
    ArrangeViewStoreContext,
  )

  return (
    <TickScrollProvider value={tickScrollStore}>
      <TrackScrollProvider value={trackScrollStore}>
        <RulerProvider value={rulerStore}>{children}</RulerProvider>
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
      return useMobxSelector(() => arrangeViewStore.notes, [arrangeViewStore])
    },
    get transform() {
      return useMobxSelector(
        () => arrangeViewStore.transform,
        [arrangeViewStore],
      )
    },
    get selectedTrackIndex() {
      return useMobxSelector(
        () => arrangeViewStore.selectedTrackIndex,
        [arrangeViewStore],
      )
    },
    get selectedTrackId() {
      return useMobxSelector(
        () => arrangeViewStore.selectedTrackId,
        [arrangeViewStore],
      )
    },
    get selection() {
      return useMobxSelector(
        () => arrangeViewStore.selection,
        [arrangeViewStore],
      )
    },
    get selectionRect() {
      return useMobxSelector(
        () => arrangeViewStore.selectionRect,
        [arrangeViewStore],
      )
    },
    get selectedEventIds() {
      return useMobxSelector(
        () => arrangeViewStore.selectedEventIds,
        [arrangeViewStore],
      )
    },
    get quantize() {
      return useMobxSelector(
        () => arrangeViewStore.quantize,
        [arrangeViewStore],
      )
    },
    get quantizer() {
      return useMobxSelector(
        () => arrangeViewStore.quantizer,
        [arrangeViewStore],
      )
    },
    get trackTransform() {
      return useMobxSelector(
        () => arrangeViewStore.trackTransform,
        [arrangeViewStore],
      )
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
    setSelectedTrackIndex: useCallback((index: number) => {
      arrangeViewStore.selectedTrackIndex = index
    }, []),
    setSelection: useCallback((selection: ArrangeSelection | null) => {
      arrangeViewStore.selection = selection
    }, []),
    setSelectedEventIds: useCallback(
      (ids: { [trackIndex: number]: number[] } = {}) => {
        arrangeViewStore.selectedEventIds = ids
      },
      [],
    ),
    setQuantize: useCallback((value: number) => {
      arrangeViewStore.quantize = value
    }, []),
    resetSelection: useCallback(() => {
      arrangeViewStore.selection = null
      arrangeViewStore.selectedEventIds = {}
    }, []),
    setOpenTransposeDialog: useSetAtom(openTransposeDialogAtom),
    setOpenVelocityDialog: useSetAtom(openVelocityDialogAtom),
    serializeState: useCallback(
      () => arrangeViewStore.serialize(),
      [arrangeViewStore],
    ),
    restoreState: useCallback(
      (state: SerializedArrangeViewStore) => {
        arrangeViewStore.restore(state)
      },
      [arrangeViewStore],
    ),
  }
}

// atoms

const openTransposeDialogAtom = atom(false)
const openVelocityDialogAtom = atom(false)
