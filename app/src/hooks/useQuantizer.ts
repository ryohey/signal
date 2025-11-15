import { createContext, useCallback, useContext } from "react"
import QuantizerStore from "../stores/QuantizerStore"
import { useMobxGetter, useMobxSelector } from "./useMobxSelector"

const QuantizerContext = createContext<QuantizerStore>(null!)
export const QuantizerProvider = QuantizerContext.Provider

export function useQuantizer(
  quantizerStore: QuantizerStore = useContext(QuantizerContext),
) {
  return {
    get quantize() {
      return useMobxGetter(quantizerStore, "quantize")
    },
    get quantizeUnit() {
      return useMobxSelector(
        () => quantizerStore.quantizer.unit,
        [quantizerStore],
      )
    },
    get isQuantizeEnabled() {
      return useMobxGetter(quantizerStore, "isQuantizeEnabled")
    },
    get quantizer() {
      return useMobxGetter(quantizerStore, "quantizer")
    },
    get quantizeRound() {
      const { quantizer } = quantizerStore
      return useCallback((tick: number) => quantizer.round(tick), [quantizer])
    },
    get quantizeFloor() {
      const { quantizer } = quantizerStore
      return useCallback((tick: number) => quantizer.floor(tick), [quantizer])
    },
    get quantizeCeil() {
      const { quantizer } = quantizerStore
      return useCallback((tick: number) => quantizer.ceil(tick), [quantizer])
    },
    get forceQuantizeRound() {
      const { quantizer } = quantizerStore
      return useCallback(
        (tick: number) => quantizer.round(tick, { force: true }),
        [quantizer],
      )
    },
    setQuantize: (quantize: number) => {
      quantizerStore.quantize = quantize
    },
    setIsQuantizeEnabled: (isEnabled: boolean) => {
      quantizerStore.isQuantizeEnabled = isEnabled
    },
  }
}
