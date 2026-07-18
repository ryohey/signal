import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { Store } from "jotai/vanilla/store"
import { createContext, useContext, useMemo } from "react"
import { BeatsProvider, createBeatsScope } from "../../../hooks/useBeats"
import {
  createQuantizerScope,
  QuantizerProvider,
} from "../../../hooks/useQuantizer"
import {
  createTickScrollScope,
  TickScrollProvider,
  useTickScroll,
} from "../../../hooks/useTickScroll"
import { TempoSelection } from "../entities/TempoSelection"

type TempoEditorStore = {
  quantizerScope: Store
  tickScrollScope: Store
  beatsScope: Store
}

// biome-ignore lint/style/noNonNullAssertion: we assume the provider is always used
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

export function useTempoTickScroll() {
  const { tickScrollScope } = useContext(TempoEditorStoreContext)
  return useTickScroll(tickScrollScope)
}

export function useTempoEditor() {
  return {
    get selection() {
      return useAtomValue(selectionAtom)
    },
    get selectedEventIds() {
      return useAtomValue(selectedEventIdsAtom)
    },
    get mouseMode() {
      return useAtomValue(mouseModeAtom)
    },
    setSelection: useSetAtom(selectionAtom),
    setSelectedEventIds: useSetAtom(selectedEventIdsAtom),
    setMouseMode: useSetAtom(mouseModeAtom),
    resetSelection: useSetAtom(resetSelectionAtom),
  }
}

// atoms
const mouseModeAtom = atom<"pencil" | "selection">("pencil")
const selectionAtom = atom<TempoSelection | null>(null)
const selectedEventIdsAtom = atom<readonly number[]>([])

// actions
const resetSelectionAtom = atom(null, (_get, set) => {
  set(selectionAtom, null)
  set(selectedEventIdsAtom, [])
})
