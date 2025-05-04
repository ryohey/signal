import { useCallback } from "react"
import { Metadata, SoundFontItem } from "../stores/SoundFontStore"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useSoundFont() {
  const { soundFontStore } = useStores()

  return {
    get files() {
      return useMobxStore(({ soundFontStore }) => soundFontStore.files)
    },
    get selectedSoundFontId() {
      return useMobxStore(
        ({ soundFontStore }) => soundFontStore.selectedSoundFontId,
      )
    },
    get scanPaths() {
      return useMobxStore(({ soundFontStore }) => soundFontStore.scanPaths)
    },
    get isLoading() {
      return useMobxStore(({ soundFontStore }) => soundFontStore.isLoading)
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
