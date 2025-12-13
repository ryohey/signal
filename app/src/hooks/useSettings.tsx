import { useAtomValue, useSetAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { focusAtom } from "jotai-optics"
import type { Language } from "../localize/useLocalization"
import type { ThemeType } from "../theme/Theme"

export function useSettings() {
  return {
    get language() {
      return useAtomValue(languageAtom)
    },
    get showNoteLabels() {
      return useAtomValue(showNoteLabelsAtom)
    },
    get themeType() {
      return useAtomValue(themeTypeAtom)
    },
    setLanguage: useSetAtom(languageAtom),
    setShowNoteLabels: useSetAtom(showNoteLabelsAtom),
    setThemeType: useSetAtom(themeTypeAtom),
  }
}

// atoms with storage
const settingStorageAtom = atomWithStorage<{
  language: Language | null
  showNoteLabels: boolean
}>("SettingStore", {
  language: null,
  showNoteLabels: true,
})
const themeStorageAtom = atomWithStorage<{
  themeType: ThemeType
}>("ThemeStore", {
  themeType: "dark",
})

// focused atoms
const languageAtom = focusAtom(settingStorageAtom, (optic) =>
  optic.prop("language")
)
const showNoteLabelsAtom = focusAtom(settingStorageAtom, (optic) =>
  optic.prop("showNoteLabels")
)
const themeTypeAtom = focusAtom(themeStorageAtom, (optic) =>
  optic.prop("themeType")
)
