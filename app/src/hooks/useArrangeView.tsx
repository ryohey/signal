import { ArrangeSelection } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { Store } from "jotai/vanilla/store"
import { cloneDeep } from "lodash"
import { createContext, useContext, useMemo } from "react"
import { BeatsProvider, createBeatsScope } from "./useBeats"
import { createQuantizerScope, QuantizerProvider } from "./useQuantizer"
import { useSong } from "./useSong"
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

// biome-ignore lint/style/noNonNullAssertion: we assume the provider is always used
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
  return {
    get selectedTrackIndex() {
      return useAtomValue(selectedTrackIndexAtom)
    },
    get selectedTrackId() {
      const { tracks } = useSong()
      const selectedTrackIndex = useAtomValue(selectedTrackIndexAtom)
      return useMemo(
        () => tracks[selectedTrackIndex]?.id,
        [selectedTrackIndex, tracks],
      )
    },
    get selection() {
      return useAtomValue(selectionAtom)
    },
    get openTransposeDialog() {
      return useAtomValue(openTransposeDialogAtom)
    },
    get openVelocityDialog() {
      return useAtomValue(openVelocityDialogAtom)
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

export const useArrangeTickScroll = () => {
  const { tickScrollScope } = useContext(ArrangeViewStoreContext)
  return useTickScroll(tickScrollScope)
}

export const useArrangeTrackScroll = () => {
  const { trackScrollScope } = useContext(ArrangeViewStoreContext)
  return useTrackScroll(trackScrollScope)
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
