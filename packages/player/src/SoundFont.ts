import {
  BasicSoundBank,
  BasicZone,
  SoundBankLoader,
} from "spessasynth_core"

interface PresetMeta {
  name: string
  samples: Map<number, SampleMeta[]> // noteNumber -> SampleMeta[]
}

interface SampleMeta {
  name: string
}


function getKeyRange(
  zone: BasicZone,
  fallbackMin: number,
  fallbackMax: number,
) {
  if (zone.hasKeyRange)
    return {
      min: zone.keyRange.min,
      max: zone.keyRange.max,
    }
  return { min: fallbackMin, max: fallbackMax }
}

export class SoundFont {
  constructor(
    readonly data: ArrayBuffer,
    readonly parsed: BasicSoundBank,
  ) {}

  getDrumKitPresets() {
    const drumKitPresets: Map<number, PresetMeta> = new Map() // programNumber -> PresetMeta
    
    for (const preset of this.parsed.presets) {
      // Only drums
      if (!preset.isDrum) {
        continue
      }
      const programNumber = preset.program
      let presetMeta = drumKitPresets.get(programNumber)
      if (!presetMeta) {
        presetMeta = {
          name: preset.name,
          samples: new Map(),
        }
        drumKitPresets.set(programNumber, presetMeta)
      }

      for (const presetZone of preset.zones) {
        const presetRange = getKeyRange(presetZone, 0, 127)
        const instrument = presetZone.instrument
        for (const instrumentZone of instrument.zones) {
          const instRange = getKeyRange(instrumentZone, presetRange.min, presetRange.max)
          const min = Math.max(presetRange.min, instRange.min)
          const max = Math.min(presetRange.max, instRange.max)
          // Sanity check
          if (min > max) continue
          
          const sampleName = instrumentZone.sample.name
          for (let key = min; key <= max; key++) {
            if (!presetMeta.samples.has(key))
              presetMeta.samples.set(key, [])
            presetMeta.samples.get(key)!.push({ name: sampleName })
          }
        }
      }
    }
    return drumKitPresets
  }

  static async loadFromURL(url: string) {
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    return await SoundFont.load(data)
  }

  static async load(data: ArrayBuffer) {
    await BasicSoundBank.isSF3DecoderReady
    const parsed = SoundBankLoader.fromArrayBuffer(data)
    return new SoundFont(data, parsed)
  }
}
