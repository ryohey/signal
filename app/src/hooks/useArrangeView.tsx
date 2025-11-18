import { ArrangeSelection } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { Store } from "jotai/vanilla/store"
import { cloneDeep } from "lodash"
import { createContext, useCallback, useContext, useMemo } from "react"
import { MaxNoteNumber } from "../Constants"
import { ArrangeCoordTransform } from "../entities/transform/ArrangeCoordTransform"
import { KeyTransform } from "../entities/transform/KeyTransform"
import { NoteCoordTransform } from "../entities/transform/NoteCoordTransform"
import { BeatsProvider, createBeatsScope } from "./useBeats"
import { useMobxSelector } from "./useMobxSelector"
import { createQuantizerScope, QuantizerProvider } from "./useQuantizer"
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
export type { ArrangeSelection } from "@signal-app/core"

type ArrangeViewStore = {
  quantizerScope: Store
  tickScrollScope: Store
  trackScrollScope: Store
  beatsScope: Store
}

const ArrangeViewStoreContext = createContext<ArrangeViewStore>(null!)

export function ArrangeViewProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const store = useStore()

  const arrangeViewStore = useMemo(() => {
    // should match the order in ArrangeViewScope
    const tickScrollScope = createTickScrollScope(store)
    const trackScrollScope = createTrackScrollScope(tickScrollScope)
    const quantizerScope = createQuantizerScope(trackScrollScope)
    const beatsScope = createBeatsScope(quantizerScope)
    return {
      quantizerScope,
      tickScrollScope,
      trackScrollScope,
      beatsScope,
    }
  }, [store])

  return (
    <ArrangeViewStoreContext.Provider value={arrangeViewStore}>
      {children}
    </ArrangeViewStoreContext.Provider>
  )
}

export function ArrangeViewScope({ children }: { children: React.ReactNode }) {
  const { tickScrollScope, trackScrollScope, quantizerScope, beatsScope } =
    useContext(ArrangeViewStoreContext)

  return (
    <TickScrollProvider scope={tickScrollScope} minScaleX={0.15} maxScaleX={15}>
      <TrackScrollProvider scope={trackScrollScope}>
        <QuantizerProvider scope={quantizerScope} quantize={1}>
          <BeatsProvider scope={beatsScope}>{children}</BeatsProvider>
        </QuantizerProvider>
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
      const { setScrollTop } = useTrackScroll(trackScrollScope)
      return useCallback(
        (x: number, y: number) => {
          setScrollLeftInPixels((prev) => prev - x)
          setScrollTop((prev) => prev - y)
        },
        [setScrollLeftInPixels, setScrollTop],
      )
    },
    setSelectedTrackIndex: useSetAtom(selectedTrackIndexAtom),
    setSelection: useSetAtom(selectionAtom),
    resetSelection: useSetAtom(resetSelectionAtom),
    setOpenTransposeDialog: useSetAtom(openTransposeDialogAtom),
    setOpenVelocityDialog: useSetAtom(openVelocityDialogAtom),
    serializeState: useSetAtom(serializeAtom),
    restoreState: useSetAtom(restoreAtom),
  }
}

// atoms
const selectionAtom = atom<ArrangeSelection | null>(null)
const selectedTrackIndexAtom = atom(0)
const openTransposeDialogAtom = atom(false)
const openVelocityDialogAtom = atom(false)

// actions
const resetSelectionAtom = atom(null, (_get, set) => {
  set(selectionAtom, null)
})
const serializeAtom = atom(null, (get) => ({
  selection: cloneDeep(get(selectionAtom)),
}))
const restoreAtom = atom(
  null,
  (
    _get,
    set,
    {
      selection,
    }: {
      selection: ArrangeSelection | null
    },
  ) => {
    set(selectionAtom, selection)
  },
)
