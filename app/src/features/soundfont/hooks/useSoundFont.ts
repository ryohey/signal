import {
  defaultSoundFontId,
  Metadata,
  SoundFontFile,
  SoundFontItem,
} from "@signal-app/core"
import { SoundFont } from "@signal-app/player"
import { atom, useAtomValue } from "jotai"
import { atomWithStorage, useAtomCallback } from "jotai/utils"
import { focusAtom } from "jotai-optics"
import { useCallback } from "react"
import { basename } from "../../../helpers/path"
import { isRunningInElectron } from "../../../helpers/platform"
import { useStores } from "../../../hooks/useStores"
import { soundFontRepository } from "../../../services/repositories"

export function useSoundFont() {
  const { synth } = useStores()

  const _loadSoundFont = useAtomCallback(
    useCallback(
      async (_get, set, id: number) => {
        try {
          set(isLoadingAtom, true)
          const soundFontItem = await soundFontRepository.getItem(id)
          if (soundFontItem === null) {
            throw new Error("SoundFont not found")
          }
          const soundFont = await loadSoundFont(soundFontItem)
          await synth.loadSoundFont(soundFont)
          set(selectedSoundFontIdAtom, id)
        } catch (e) {
          console.error(e)
          alert(`Failed to load SoundFont: ${(e as Error).message}`)
        } finally {
          set(isLoadingAtom, false)
        }
      },
      [synth],
    ),
  )

  const updateFileList = useAtomCallback(
    useCallback(async (_get, set) => {
      const files = await soundFontRepository.list()
      set(filesAtom, files)
    }, []),
  )

  const _scanSoundFonts = useAtomCallback(
    useCallback(
      async (get, _set) => {
        if (!isRunningInElectron()) {
          return
        }
        const scanPaths = get(scanPathsAtom)
        await soundFontRepository.removeScanned(scanPaths)
        const items = await scanSoundFonts(scanPaths)
        await soundFontRepository.saveMany(items)
        await updateFileList()
      },
      [updateFileList],
    ),
  )

  return {
    get files() {
      return useAtomValue(filesAtom)
    },
    get selectedSoundFontId() {
      return useAtomValue(selectedSoundFontIdAtom)
    },
    get scanPaths() {
      return useAtomValue(scanPathsAtom)
    },
    get isLoading() {
      return useAtomValue(isLoadingAtom)
    },
    initSoundFont: useAtomCallback(
      useCallback(
        async (get) => {
          await soundFontRepository.init()
          const soundFontId = get(selectedSoundFontIdAtom) ?? defaultSoundFontId
          await _loadSoundFont(soundFontId)
          await updateFileList()
        },
        [_loadSoundFont, updateFileList],
      ),
    ),
    load: _loadSoundFont,
    addSoundFont: useCallback(
      async (item: SoundFontItem, metadata: Metadata) => {
        await soundFontRepository.save(item, metadata)
        await updateFileList()
      },
      [updateFileList],
    ),
    removeSoundFont: useCallback(
      async (id: number) => {
        await soundFontRepository.remove(id)
        await updateFileList()
      },
      [updateFileList],
    ),
    scanSoundFonts: _scanSoundFonts,
    removeScanPath: useAtomCallback(
      useCallback(
        async (get, _set, path: string) => {
          const scanPaths = get(scanPathsAtom)
          await soundFontRepository.removeScanned(scanPaths)
          const newScanPaths = scanPaths.filter((p) => p !== path)
          _set(scanPathsAtom, newScanPaths)
          await _scanSoundFonts()
        },
        [_scanSoundFonts],
      ),
    ),
    addScanPath: useAtomCallback(
      useCallback(
        async (get, _set, path: string) => {
          const scanPaths = get(scanPathsAtom)
          if (scanPaths.includes(path)) {
            return
          }
          const newScanPaths = [...scanPaths, path]
          _set(scanPathsAtom, newScanPaths)
          await _scanSoundFonts()
        },
        [_scanSoundFonts],
      ),
    ),
  }
}

async function loadSoundFont(soundfont: SoundFontItem) {
  switch (soundfont.type) {
    case "local":
      return SoundFont.load(soundfont.data)
    case "remote":
      return await SoundFont.loadFromURL(soundfont.url)
    case "file": {
      const data = await window.electronAPI.readFile(soundfont.path)
      return await SoundFont.load(data)
    }
  }
}

async function scanSoundFonts(
  scanPaths: readonly string[],
): Promise<{ data: SoundFontItem; metadata: Metadata }[]> {
  if (!isRunningInElectron()) {
    return []
  }

  const items: { data: SoundFontItem; metadata: Metadata }[] = []

  for (const scanPath of scanPaths) {
    const files = await window.electronAPI.searchSoundFonts(scanPath)

    const newItems = files.map((file) => ({
      data: <SoundFontItem>{ type: "file", path: file },
      metadata: <Metadata>{ name: basename(file), scanPath },
    }))

    items.push(...newItems)
  }

  return items
}

// atoms
const isLoadingAtom = atom(false)
const filesAtom = atom<readonly SoundFontFile[]>([])
const storageAtom = atomWithStorage<{
  selectedSoundFontId: number | null
  scanPaths: readonly string[]
}>(
  "soundFontStore",
  {
    selectedSoundFontId: defaultSoundFontId,
    scanPaths: [],
  },
  undefined,
  {
    getOnInit: true,
  },
)
const selectedSoundFontIdAtom = focusAtom(storageAtom, (optic) =>
  optic.prop("selectedSoundFontId"),
)
const scanPathsAtom = focusAtom(storageAtom, (optic) => optic.prop("scanPaths"))
