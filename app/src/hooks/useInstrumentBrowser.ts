import { useCallback } from "react"
import { InstrumentSetting } from "../components/InstrumentBrowser/InstrumentBrowser"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useInstrumentBrowser() {
  const { pianoRollStore } = useStores()

  return {
    get setting() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.instrumentBrowserSetting,
      )
    },
    get isOpen() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.openInstrumentBrowser,
      )
    },
    setOpen: useCallback(
      (open: boolean) => (pianoRollStore.openInstrumentBrowser = open),
      [pianoRollStore],
    ),
    setSetting: useCallback(
      (setting: InstrumentSetting) =>
        (pianoRollStore.instrumentBrowserSetting = setting),
      [pianoRollStore],
    ),
  }
}
