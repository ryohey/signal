export type { Metadata, SoundFontItem } from "../stores/SoundFontStore"
import { useMobxGetter } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useSoundFont() {
  const { soundFontStore } = useStores()

  return {
    get files() {
      return useMobxGetter(soundFontStore, "files")
    },
    get selectedSoundFontId() {
      return useMobxGetter(soundFontStore, "selectedSoundFontId")
    },
    get scanPaths() {
      return useMobxGetter(soundFontStore, "scanPaths")
    },
    get isLoading() {
      return useMobxGetter(soundFontStore, "isLoading")
    },
    load: soundFontStore.load,
    addSoundFont: soundFontStore.addSoundFont,
    removeSoundFont: soundFontStore.removeSoundFont,
    scanSoundFonts: soundFontStore.scanSoundFonts,
    removeScanPath: soundFontStore.removeScanPath,
    addScanPath: soundFontStore.addScanPath,
  }
}
