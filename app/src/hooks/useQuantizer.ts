import { createContext, useContext } from "react"
import QuantizerStore from "../stores/QuantizerStore"
import { useMobxGetter } from "./useMobxSelector"

const QuantizerContext = createContext<QuantizerStore>(null!)
export const QuantizerProvider = QuantizerContext.Provider

export function useQuantizer(
  quantizerStore: QuantizerStore = useContext(QuantizerContext),
) {
  return {
    get quantize() {
      return useMobxGetter(quantizerStore, "quantize")
    },
    get isQuantizeEnabled() {
      return useMobxGetter(quantizerStore, "isQuantizeEnabled")
    },
    get quantizer() {
      return useMobxGetter(quantizerStore, "quantizer")
    },
    get enabledQuantizer() {
      return useMobxGetter(quantizerStore, "enabledQuantizer")
    },
    setQuantize: (quantize: number) => {
      quantizerStore.quantize = quantize
    },
    setIsQuantizeEnabled: (isEnabled: boolean) => {
      quantizerStore.isQuantizeEnabled = isEnabled
    },
  }
}
