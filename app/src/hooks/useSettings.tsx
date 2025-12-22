import { useAtomValue, useSetAtom } from "jotai"
import { focusAtom } from "jotai-optics"
import { atomWithStorage } from "jotai/utils"
import { Language } from "../localize/useLocalization"
import { ThemeType } from "../theme/Theme"

export function useSettings() {
  return {
    get language() {
      return useAtomValue(languageAtom)
    },
    get showNoteLabels() {
      return useAtomValue(showNoteLabelsAtom)
    },
    get verticalPiano() {
      return useAtomValue(verticalPianoAtom)
    },
    get themeType() {
      return useAtomValue(themeTypeAtom)
    },
    setLanguage: useSetAtom(languageAtom),
    setShowNoteLabels: useSetAtom(showNoteLabelsAtom),
    setVerticalPiano: useSetAtom(verticalPianoAtom),
    setThemeType: useSetAtom(themeTypeAtom),
  }
}

// atoms with storage
const settingStorageAtom = atomWithStorage<{
  language: Language | null
  showNoteLabels: boolean
  verticalPiano: boolean
}>("SettingStore", {
  language: null,
  showNoteLabels: true,
  verticalPiano: true, // TODO(sagudev): change this to false
})
const themeStorageAtom = atomWithStorage<{
  themeType: ThemeType
}>("ThemeStore", {
  themeType: "dark",
})

// focused atoms
const languageAtom = focusAtom(settingStorageAtom, (optic) =>
  optic.prop("language"),
)
const showNoteLabelsAtom = focusAtom(settingStorageAtom, (optic) =>
  optic.prop("showNoteLabels"),
)
const verticalPianoAtom = focusAtom(settingStorageAtom, (optic) =>
  optic.prop("verticalPiano"),
)
const themeTypeAtom = focusAtom(themeStorageAtom, (optic) =>
  optic.prop("themeType"),
)
