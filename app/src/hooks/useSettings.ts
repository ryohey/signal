import { useCallback } from "react"
import { Language } from "../localize/useLocalization"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useSettings() {
  const { settingStore } = useStores()

  return {
    get language() {
      return useMobxStore(({ settingStore }) => settingStore.language)
    },
    setLanguage: useCallback(
      (language: Language | null) => {
        settingStore.language = language
      },
      [settingStore],
    ),
  }
}
