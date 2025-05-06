import { useCallback } from "react"
import { Language } from "../localize/useLocalization"
import { ThemeType } from "../theme/Theme"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useSettings() {
  const { settingStore, themeStore } = useStores()

  return {
    get language() {
      return useMobxStore(({ settingStore }) => settingStore.language)
    },
    get themeType() {
      return useMobxStore(({ themeStore }) => themeStore.themeType)
    },
    setLanguage: useCallback(
      (language: Language | null) => {
        settingStore.language = language
      },
      [settingStore],
    ),
    setThemeType: useCallback(
      (themeType: ThemeType) => {
        themeStore.themeType = themeType
      },
      [themeStore],
    ),
  }
}
