import { IndexedDBStorage } from "../data/IndexedDBStorage"
import {
  Metadata,
  SoundFontFile,
  SoundFontItem,
} from "../entities/soundFont/SoundFont"
import { isRunningInElectron } from "../helpers/platform"

const defaultSoundFont: SoundFontItem & Metadata & { id: number } =
  isRunningInElectron()
    ? {
        id: -999, // Use negative number to avoid conflict with user saved soundfonts
        type: "file",
        path: "./assets/soundfonts/A320U.sf2",
        name: "A320U.sf2 (Signal Factory Sound)",
      }
    : {
        id: -999, // Use negative number to avoid conflict with user saved soundfonts
        type: "remote",
        name: "A320U.sf2 (Signal Factory Sound)",
        url: "https://cdn.jsdelivr.net/gh/ryohey/signal@4569a31/public/A320U.sf2",
      }

export const defaultSoundFontId = defaultSoundFont.id

export class SoundFontRepository {
  private readonly storage = new IndexedDBStorage<SoundFontItem, Metadata>(
    "soundfonts",
    1,
  )

  async init() {
    await this.storage.init()
  }

  async list(): Promise<readonly SoundFontFile[]> {
    const list = await this.storage.list()
    const savedFiles = Object.keys(list).map((id) => ({
      ...list[Number(id)],
      id: Number(id),
    }))
    return [defaultSoundFont, ...savedFiles]
  }

  async getItem(id: number): Promise<SoundFontItem | null> {
    if (defaultSoundFont.id === id) {
      return defaultSoundFont
    }
    return await this.storage.load(id)
  }

  async save(item: SoundFontItem, metadata: Metadata): Promise<void> {
    await this.storage.save(item, metadata)
  }

  async saveMany(
    items: { data: SoundFontItem; metadata: Metadata }[],
  ): Promise<void> {
    await this.storage.saveMany(items)
  }

  async remove(id: number): Promise<void> {
    await this.storage.delete(id)
  }

  async removeScanned(scanPaths: readonly string[]): Promise<void> {
    const list = await this.storage.list()
    const ids = Object.entries(list)
      .filter(
        ([, f]) => f.scanPath !== undefined && scanPaths.includes(f.scanPath),
      )
      .map(([id]) => Number(id))
    await this.storage.deleteMany(ids)
  }
}
