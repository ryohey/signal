import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { createScope, ScopeProvider } from "jotai-scope"
import { Store } from "jotai/vanilla/store"
import { useCallback, useEffect, useMemo } from "react"
import Quantizer from "../quantizer"
import { useStores } from "./useStores"

export function QuantizerProvider({
  scope,
  quantize,
  children,
}: {
  scope: Store
  quantize: number
  children: React.ReactNode
}) {
  const setQuantize = useSetAtom(quantizeAtom, { store: scope })

  useEffect(() => {
    setQuantize(quantize)
  }, [setQuantize, quantize])

  return <ScopeProvider scope={scope}>{children}</ScopeProvider>
}

export const createQuantizerScope = (parentStore: Store) =>
  createScope({
    atoms: new Set([quantizeAtom, isEnabledAtom]),
    parentStore,
  })

export function useQuantizer(store = useStore()) {
  const { songStore } = useStores()
  const quantize = useAtomValue(quantizeAtom, { store })
  const isEnabled = useAtomValue(isEnabledAtom, { store })
  const quantizer = useMemo(
    () => new Quantizer(songStore, quantize, isEnabled),
    [songStore, quantize, isEnabled],
  )

  return {
    get quantize() {
      return useAtomValue(quantizeAtom, { store })
    },
    get quantizeUnit() {
      return quantizer.unit
    },
    get isQuantizeEnabled() {
      return useAtomValue(isEnabledAtom, { store })
    },
    get quantizer() {
      return quantizer
    },
    get quantizeRound() {
      return useCallback((tick: number) => quantizer.round(tick), [])
    },
    get quantizeFloor() {
      return useCallback((tick: number) => quantizer.floor(tick), [])
    },
    get quantizeCeil() {
      return useCallback((tick: number) => quantizer.ceil(tick), [])
    },
    get forceQuantizeRound() {
      return useCallback(
        (tick: number) => quantizer.round(tick, { force: true }),
        [],
      )
    },
    setQuantize: useSetAtom(quantizeAtom, { store }),
    setIsQuantizeEnabled: useSetAtom(isEnabledAtom, { store }),
  }
}

// atoms
const quantizeAtom = atom(4)
const isEnabledAtom = atom(true)
