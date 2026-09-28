import type { TempoEditor } from "@signal-app/tempo-editor"
import { atom, useAtomValue, useSetAtom } from "jotai"
import type { Store } from "jotai/vanilla/store"
import { createContext, useContext } from "react"
import { historyAtom } from "../../../hooks/historyAtom"
import { BeatsProvider } from "../../../hooks/useBeats"
import { QuantizerProvider } from "../../../hooks/useQuantizer"
import { TickScrollProvider, useTickScroll } from "../../../hooks/useTickScroll"
import type { TempoSelection } from "../entities/TempoSelection"

type TempoEditorStore = {
  quantizerScope: Store
  tickScrollScope: Store
  beatsScope: Store
}

// biome-ignore lint/style/noNonNullAssertion: we assume the provider is always used
export const TempoEditorStoreContext = createContext<TempoEditorStore>(null!)
// biome-ignore lint/style/noNonNullAssertion: we assume the provider is always used
export const TempoEditorContext = createContext<TempoEditor>(null!)

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

export function useTempoEditorService() {
  return useContext(TempoEditorContext)
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
const selectionAtom = historyAtom(atom<TempoSelection | null>(null))
const selectedEventIdsAtom = historyAtom(atom<readonly number[]>([]))

// actions
const resetSelectionAtom = atom(null, (_get, set) => {
  set(selectionAtom, null)
  set(selectedEventIdsAtom, [])
})
