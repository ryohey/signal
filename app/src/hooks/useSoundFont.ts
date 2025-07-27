import { useCallback } from "react"
import { Metadata, SoundFontItem } from "../stores/SoundFontStore"
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
    load: useCallback(
      async (id: number) => {
        return await soundFontStore.load(id)
      },
      [soundFontStore],
    ),
    addSoundFont: useCallback(
      async (item: SoundFontItem, metadata: Metadata) => {
        return await soundFontStore.addSoundFont(item, metadata)
      },
      [soundFontStore],
    ),
    removeSoundFont: useCallback(
      async (id: number) => {
        return await soundFontStore.removeSoundFont(id)
      },
      [soundFontStore],
    ),
    scanSoundFonts: useCallback(async () => {
      return await soundFontStore.scanSoundFonts()
    }, [soundFontStore]),
    removeScanPath: useCallback(
      async (path: string) => {
        return await soundFontStore.removeScanPath(path)
      },
      [soundFontStore],
    ),
    addScanPath: useCallback(
      async (path: string) => {
        return await soundFontStore.addScanPath(path)
      },
      [soundFontStore],
    ),
  }
}
