import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { Store } from "jotai/vanilla/store"
import { cloneDeep } from "lodash"
import { createContext, useCallback, useContext, useMemo } from "react"
import { MaxNoteNumber } from "../Constants"
import { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import { ArrangeCoordTransform } from "../entities/transform/ArrangeCoordTransform"
import { KeyTransform } from "../entities/transform/KeyTransform"
import { NoteCoordTransform } from "../entities/transform/NoteCoordTransform"
import ArrangeViewStore from "../stores/ArrangeViewStore"
import { BeatsProvider } from "./useBeats"
import { useMobxSelector } from "./useMobxSelector"
import { QuantizerProvider } from "./useQuantizer"
import { useStores } from "./useStores"
import {
  createTickScrollScope,
  TickScrollProvider,
  useTickScroll,
} from "./useTickScroll"
import { TrackScrollProvider, useTrackScroll } from "./useTrackScroll"
export type { ArrangeSelection } from "../entities/selection/ArrangeSelection"

const ArrangeViewStoreContext = createContext<ArrangeViewStore>(null!)
const ArrangeTickScrollScopeContext = createContext<Store>(null!)

export function ArrangeViewProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { songStore } = useStores()
  const store = useStore()

  const arrangeViewStore = useMemo(
    () => new ArrangeViewStore(songStore),
    [songStore],
  )
  const tickScrollScope = useMemo(() => createTickScrollScope(store), [store])

  return (
    <ArrangeViewStoreContext.Provider value={arrangeViewStore}>
      <ArrangeTickScrollScopeContext.Provider value={tickScrollScope}>
        {children}
      </ArrangeTickScrollScopeContext.Provider>
    </ArrangeViewStoreContext.Provider>
  )
}

export function ArrangeViewScope({ children }: { children: React.ReactNode }) {
  const { trackScrollStore, quantizerStore } = useContext(
    ArrangeViewStoreContext,
  )
  const tickScrollScope = useContext(ArrangeTickScrollScopeContext)

  return (
    <TickScrollProvider scope={tickScrollScope} minScaleX={0.15} maxScaleX={15}>
      <TrackScrollProvider value={trackScrollStore}>
        <BeatsProvider>
          <QuantizerProvider value={quantizerStore}>
            {children}
          </QuantizerProvider>
        </BeatsProvider>
      </TrackScrollProvider>
    </TickScrollProvider>
  )
}

export function useArrangeView() {
  const arrangeViewStore = useContext(ArrangeViewStoreContext)
  const tickScrollScope = useContext(ArrangeTickScrollScopeContext)
  const { trackScrollStore } = arrangeViewStore
  const { songStore } = useStores()
  const { setScrollLeftInPixels } = useTickScroll(tickScrollScope)
  const { setScrollTop } = useTrackScroll(trackScrollStore)

  return {
    get transform() {
      const { transform: tickTransform } = useTickScroll(tickScrollScope)
      const { trackHeight } = useTrackScroll(trackScrollStore)
      const bottomBorderWidth = 1
      const keyTransform = useMemo(
        () =>
          new KeyTransform(
            (trackHeight - bottomBorderWidth) / MaxNoteNumber,
            MaxNoteNumber,
          ),
        [trackHeight],
      )
      return useMemo(
        () => new NoteCoordTransform(tickTransform, keyTransform),
        [tickTransform, keyTransform],
      )
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
      const { transform: tickTransform } = useTickScroll(tickScrollScope)
      const { transform: trackTransform } = useTrackScroll(trackScrollStore)
      return useMemo(
        () => new ArrangeCoordTransform(tickTransform, trackTransform),
        [tickTransform, trackTransform],
      )
    },
    get openTransposeDialog() {
      return useAtomValue(openTransposeDialogAtom)
    },
    get openVelocityDialog() {
      return useAtomValue(openVelocityDialogAtom)
    },
    scrollBy: useCallback(
      (x: number, y: number) => {
        setScrollLeftInPixels((prev) => prev - x)
        setScrollTop(trackScrollStore.scrollTop - y)
      },
      [setScrollLeftInPixels, setScrollTop, trackScrollStore],
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
