import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { Store } from "jotai/vanilla/store"
import { cloneDeep } from "lodash"
import { createContext, useCallback, useContext, useMemo } from "react"
import { MaxNoteNumber } from "../Constants"
import { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import { ArrangeCoordTransform } from "../entities/transform/ArrangeCoordTransform"
import { KeyTransform } from "../entities/transform/KeyTransform"
import { NoteCoordTransform } from "../entities/transform/NoteCoordTransform"
import QuantizerStore from "../stores/QuantizerStore"
import { BeatsProvider } from "./useBeats"
import { useMobxSelector } from "./useMobxSelector"
import { QuantizerProvider } from "./useQuantizer"
import { useStores } from "./useStores"
import {
  createTickScrollScope,
  TickScrollProvider,
  useTickScroll,
} from "./useTickScroll"
import {
  createTrackScrollScope,
  TrackScrollProvider,
  useTrackScroll,
} from "./useTrackScroll"
export type { ArrangeSelection } from "../entities/selection/ArrangeSelection"

type ArrangeViewStore = {
  quantizerStore: QuantizerStore
  tickScrollScope: Store
  trackScrollScope: Store
}

const ArrangeViewStoreContext = createContext<ArrangeViewStore>(null!)

export function ArrangeViewProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { songStore } = useStores()
  const store = useStore()

  const arrangeViewStore = useMemo(
    () => ({
      quantizerStore: new QuantizerStore(songStore, 1),
      tickScrollScope: createTickScrollScope(store),
      trackScrollScope: createTrackScrollScope(store),
    }),
    [songStore, store],
  )

  return (
    <ArrangeViewStoreContext.Provider value={arrangeViewStore}>
      {children}
    </ArrangeViewStoreContext.Provider>
  )
}

export function ArrangeViewScope({ children }: { children: React.ReactNode }) {
  const { quantizerStore } = useContext(ArrangeViewStoreContext)
  const { tickScrollScope, trackScrollScope } = useContext(
    ArrangeViewStoreContext,
  )

  return (
    <TickScrollProvider scope={tickScrollScope} minScaleX={0.15} maxScaleX={15}>
      <TrackScrollProvider scope={trackScrollScope}>
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
  const { tickScrollScope, trackScrollScope } = useContext(
    ArrangeViewStoreContext,
  )
  return {
    get transform() {
      const { transform: tickTransform } = useTickScroll(tickScrollScope)
      const { trackHeight } = useTrackScroll(trackScrollScope)
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
      const { songStore } = useStores()
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
      const { transform: trackTransform } = useTrackScroll(trackScrollScope)
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
    get scrollBy() {
      const { setScrollLeftInPixels } = useTickScroll(tickScrollScope)
      const { setScrollTop, scrollTop } = useTrackScroll(trackScrollScope)
      return useCallback(
        (x: number, y: number) => {
          setScrollLeftInPixels((prev) => prev - x)
          setScrollTop(scrollTop - y)
        },
        [setScrollLeftInPixels, setScrollTop, scrollTop],
      )
    },
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
