import { makeObservable, observable } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { createContext, useCallback, useContext } from "react"
import { Language } from "../localize/useLocalization"
import { ThemeType } from "../theme/Theme"
import { useMobxSelector } from "./useMobxSelector"

class ThemeStore {
  themeType: ThemeType = "dark"

  constructor() {
    makeObservable(this, {
      themeType: observable,
    })

    makePersistable(this, {
      name: "ThemeStore",
      properties: ["themeType"],
      storage: window.localStorage,
    })
  }
}

class SettingStore {
  language: Language | null = null
  showNoteLabels: boolean = true

  constructor() {
    makeObservable(this, {
      language: observable,
      showNoteLabels: observable,
    })

    makePersistable(this, {
      name: "SettingStore",
      properties: ["language", "showNoteLabels"],
      storage: window.localStorage,
    })
  }
}

const SettingStoreContext = createContext<SettingStore>(null!)
const ThemeStoreContext = createContext<ThemeStore>(null!)

export function SettingProvider({ children }: { children: React.ReactNode }) {
  return (
    <SettingStoreContext.Provider value={new SettingStore()}>
      <ThemeStoreContext.Provider value={new ThemeStore()}>
        {children}
      </ThemeStoreContext.Provider>
    </SettingStoreContext.Provider>
  )
}

export function useSettings() {
  const settingStore = useContext(SettingStoreContext)
  const themeStore = useContext(ThemeStoreContext)

  return {
    get language() {
      return useMobxSelector(() => settingStore.language, [settingStore])
    },
    get showNoteLabels() {
      return useMobxSelector(() => settingStore.showNoteLabels, [settingStore])
    },
    setShowNoteLabels: useCallback(
      (value: boolean) => {
        settingStore.showNoteLabels = value
      },
      [settingStore],
    ),
    get themeType() {
      return useMobxSelector(() => themeStore.themeType, [themeStore])
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
