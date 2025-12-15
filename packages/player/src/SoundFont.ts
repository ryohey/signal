interface PresetMeta {
  name: string
  samples: Map<number, SampleMeta[]> // noteNumber -> SampleMeta[]
}

interface SampleMeta {
  name: string
}

export class SoundFont {
  constructor(readonly data: ArrayBuffer) {}

  /**
   * Get drum kit presets from the SoundFont.
   * Note: This is a simplified implementation that returns empty data.
   * The full implementation would require parsing the SoundFont structure.
   * @returns Map of programNumber -> PresetMeta
   */
  getDrumKitPresets(): Map<number, PresetMeta> {
    // TODO: Implement drum kit preset extraction using spessasynth if needed
    // For now, return empty map (drum key names won't display in UI)
    return new Map()
  }

  static async loadFromURL(url: string) {
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    return this.load(data)
  }

  static async load(data: ArrayBuffer) {
    return new SoundFont(data)
  }
}
