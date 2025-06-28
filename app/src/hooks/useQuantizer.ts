import { createContext, useContext } from "react"
import QuantizerStore from "../stores/QuantizerStore"
import { useMobxSelector } from "./useMobxSelector"

const QuantizerContext = createContext<QuantizerStore>(null!)
export const QuantizerProvider = QuantizerContext.Provider

export function useQuantizer() {
  const quantizerStore = useContext(QuantizerContext)

  return {
    get quantize() {
      return useMobxSelector(() => quantizerStore.quantize, [quantizerStore])
    },
    get isQuantizeEnabled() {
      return useMobxSelector(
        () => quantizerStore.isQuantizeEnabled,
        [quantizerStore],
      )
    },
    get quantizer() {
      return useMobxSelector(() => quantizerStore.quantizer, [quantizerStore])
    },
    get enabledQuantizer() {
      return useMobxSelector(
        () => quantizerStore.enabledQuantizer,
        [quantizerStore],
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
