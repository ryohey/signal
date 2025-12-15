import { SoundFont, SoundFontSynth } from "@signal-app/player"
import { makeObservable, observable } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { basename } from "../helpers/path"
import { isRunningInElectron } from "../helpers/platform"
import { IndexedDBStorage } from "../services/IndexedDBStorage"

interface LocalSoundFont {
  type: "local"
  data: ArrayBuffer
}

interface RemoteSoundFont {
  type: "remote"
  url: string
}

// electron only feature
interface FileSoundFont {
  type: "file"
  path: string
}

export interface Metadata {
  name: string
  scanPath?: string // FileSoundFont scan path
}

export type SoundFontFile = Metadata & { id: number }

export type SoundFontItem = LocalSoundFont | RemoteSoundFont | FileSoundFont

const defaultSoundFonts: (SoundFontItem & Metadata & { id: number })[] =
  isRunningInElectron()
    ? [
        {
          id: -999, // Use negative number to avoid conflict with user saved soundfonts
          type: "file",
          path: "./assets/soundfonts/A320U.sf2",
          name: "A320U.sf2 (Signal Factory Sound)",
        },
      ]
    : [
        {
          id: -999, // Use negative number to avoid conflict with user saved soundfonts
          type: "remote",
          name: "A320U.sf2 (Signal Factory Sound)",
          url: "https://cdn.jsdelivr.net/gh/ryohey/signal@4569a31/public/A320U.sf2",
        },
      ]

export class SoundFontStore {
  private readonly storage: IndexedDBStorage<SoundFontItem, Metadata>
  files: readonly SoundFontFile[] = []
  selectedSoundFontId: number | null = null
  scanPaths: readonly string[] = []
  isLoading = false

  constructor(private readonly synth: SoundFontSynth) {
    makeObservable(this, {
      files: observable.shallow,
      selectedSoundFontId: observable,
      scanPaths: observable.shallow,
      isLoading: observable,
    })

    this.storage = new IndexedDBStorage("soundfonts", 1)
  }

  async init() {
    await makePersistable(this, {
      name: "SoundFontStore",
      properties: ["selectedSoundFontId", "scanPaths"],
      storage: window.localStorage,
    })

    await this.storage.init()
    await this.updateFileList()

    // load last selected soundfont on startup
    await this.load(this.selectedSoundFontId ?? defaultSoundFonts[0].id)
  }

  private async updateFileList() {
    const list = await this.storage.list()
    const savedFiles = Object.keys(list).map((id) => ({
      ...list[Number(id)],
      id: Number(id),
    }))
    this.files = [...defaultSoundFonts, ...savedFiles]
  }

  private async getSoundFont(id: number): Promise<SoundFontItem | null> {
    const defaultSoundFont = defaultSoundFonts.find((f) => f.id === id)
    if (defaultSoundFont !== undefined) {
      return defaultSoundFont
    }
    return await this.storage.load(id)
  }

  load = async (id: number) => {
    const soundfont = await this.getSoundFont(id)

    if (soundfont === null) {
      throw new Error("SoundFont not found")
    }

    this.isLoading = true
    await this.synth.loadSoundFont(await loadSoundFont(soundfont))
    this.selectedSoundFontId = id
    this.isLoading = false
  }

  addSoundFont = async (item: SoundFontItem, metadata: Metadata) => {
    await this.storage.save(item, metadata)
    await this.updateFileList()
  }

  removeSoundFont = async (id: number) => {
    await this.storage.delete(id)
    await this.updateFileList()
  }

  scanSoundFonts = async () => {
    if (!isRunningInElectron()) {
      return
    }

    await this.clearScannedSoundFonts()

    const items: { data: SoundFontItem; metadata: Metadata }[] = []

    for (const scanPath of this.scanPaths) {
      const files = await window.electronAPI.searchSoundFonts(scanPath)

      const newItems = files.map((file) => ({
        data: <SoundFontItem>{ type: "file", path: file },
        metadata: <Metadata>{ name: basename(file), scanPath },
      }))

      items.push(...newItems)
    }

    await this.storage.saveMany(items)
    await this.updateFileList()
  }

  private async clearScannedSoundFonts() {
    const list = await this.storage.list()
    const itemsInScanPaths = Object.entries(list)
      .filter(
        ([, f]) =>
          f.scanPath !== undefined && this.scanPaths.includes(f.scanPath),
      )
      .map(([id]) => Number(id))
    await this.storage.deleteMany(itemsInScanPaths)
  }

  removeScanPath = async (path: string) => {
    await this.clearScannedSoundFonts()
    this.scanPaths = this.scanPaths.filter((p) => p !== path)
    this.scanSoundFonts()
  }

  addScanPath = async (path: string) => {
    if (this.scanPaths.includes(path)) {
      return
    }
    this.scanPaths = [...this.scanPaths, path]
    await this.scanSoundFonts()
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
