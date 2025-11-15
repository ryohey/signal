import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { createScope, ScopeProvider } from "jotai-scope"
import { Store } from "jotai/vanilla/store"
import { useCallback, useEffect, useMemo } from "react"
import { Measure } from "../entities/measure/Measure"
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

function useQuantizeCalc(store: Store, fn: (tick: number) => number) {
  const { songStore } = useStores()
  const quantize = useAtomValue(quantizeAtom, { store })

  return useCallback(
    (tick: number) => {
      const measureStart = Measure.getMeasureStart(
        songStore.song.measures,
        tick,
        songStore.song.timebase,
      )
      const beats = quantize === 1 ? (measureStart.numerator ?? 4) : 4
      const u = (songStore.song.timebase * beats) / quantize
      const offset = measureStart?.tick ?? 0
      return fn((tick - offset) / u) * u + offset
    },
    [songStore, quantize, fn],
  )
}

export function useQuantizer(store = useStore()) {
  return {
    get quantize() {
      return useAtomValue(quantizeAtom, { store })
    },
    get quantizeUnit() {
      const { songStore } = useStores()
      const quantize = useAtomValue(quantizeAtom, { store })
      return useMemo(
        () => (songStore.song.timebase * 4) / quantize,
        [songStore, quantize],
      )
    },
    get isQuantizeEnabled() {
      return useAtomValue(isEnabledAtom, { store })
    },
    get quantizeRound() {
      const isEnabled = useAtomValue(isEnabledAtom, { store })
      const calc = useQuantizeCalc(store, Math.round)
      return isEnabled ? calc : Math.round
    },
    get quantizeFloor() {
      const isEnabled = useAtomValue(isEnabledAtom, { store })
      const calc = useQuantizeCalc(store, Math.floor)
      return isEnabled ? calc : Math.floor
    },
    get quantizeCeil() {
      const isEnabled = useAtomValue(isEnabledAtom, { store })
      const calc = useQuantizeCalc(store, Math.ceil)
      return isEnabled ? calc : Math.ceil
    },
    get forceQuantizeRound() {
      return useQuantizeCalc(store, Math.round)
    },
    setQuantize: useSetAtom(quantizeAtom, { store }),
    setIsQuantizeEnabled: useSetAtom(isEnabledAtom, { store }),
  }
}

// atoms
const quantizeAtom = atom(4)
const isEnabledAtom = atom(true)
