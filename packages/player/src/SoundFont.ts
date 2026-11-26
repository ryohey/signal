import {
  type BasicPreset,
  BasicSoundBank,
  type BasicZone,
  DEFAULT_SYNTH_MODE,
  MIDIPatchTools,
  SoundBankLoader
} from "spessasynth_core";

export interface SoundFontPreset {
  name: string
  programNumber: number
  bankMSB: number
  bankLSB: number
  isDrum: boolean
  isGMGSDrum: boolean
}

interface PresetMeta {
  name: string
  samples: Map<number, SampleMeta[]> // noteNumber -> SampleMeta[]
}

interface SampleMeta {
  name: string
}

const toSoundFontPreset = (p: BasicPreset) => ({
  name: p.name,
  programNumber: p.program,
  bankMSB: p.bankMSB,
  bankLSB: p.bankLSB,
  isDrum: p.isDrum,
  isGMGSDrum: p.isGMGSDrum,
})

/**
 * Program number → bank MSB → bank LSBs, all in ascending order.
 */
export type PatchTree = ReadonlyMap<
  number,
  ReadonlyMap<number, readonly number[]>
>

const buildPatchTree = (presets: SoundFontPreset[], isDrum: boolean) => {
  const ofKind = presets.filter((p) => p.isDrum === isDrum)
  // Drum tracks are GS drum channels, where the synth only picks GS drum
  // kits. XG kits (bank MSB 127) would play the GS kit instead, so they are
  // left out unless the SoundFont has nothing else.
  const gsDrumKits = ofKind.filter((p) => p.isGMGSDrum)
  const selectable = isDrum && gsDrumKits.length > 0 ? gsDrumKits : ofKind
  selectable.sort(
    (a, b) =>
      a.programNumber - b.programNumber ||
      a.bankMSB - b.bankMSB ||
      a.bankLSB - b.bankLSB,
  )

  const tree = new Map<number, Map<number, number[]>>()
  for (const p of selectable) {
    const banks = tree.get(p.programNumber) ?? new Map<number, number[]>()
    tree.set(p.programNumber, banks)
    const bankLSBs = banks.get(p.bankMSB) ?? new Array<number>()
    banks.set(p.bankMSB, bankLSBs)
    if (!bankLSBs.includes(p.bankLSB)) {
      bankLSBs.push(p.bankLSB)
    }
  }
  return tree
}

function getKeyRange(
  zone: BasicZone,
  fallbackMin: number,
  fallbackMax: number,
) {
  if (zone.hasKeyRange) {
    return {
      min: zone.keyRange.min,
      max: zone.keyRange.max,
    }
  }
  return { min: fallbackMin, max: fallbackMax }
}

export class SoundFont {
  constructor(
    readonly data: ArrayBuffer,
    readonly parsed: BasicSoundBank,
  ) {
    const presets = parsed.presets.map(toSoundFontPreset)
    this.melodicPatches = buildPatchTree(presets, false)
    this.drumPatches = buildPatchTree(presets, true)
  }

  /**
   * The patches that can be picked for a melodic track.
   */
  public readonly melodicPatches: PatchTree

  /**
   * The patches that can be picked for a rhythm track.
   */
  public readonly drumPatches: PatchTree

  /**
   * Finds the preset the synth plays for a program and bank, falling back the
   * same way the synth does when there is no exact match.
   */
  public selectPreset(
    patch: Pick<SoundFontPreset, "programNumber" | "bankMSB" | "bankLSB">,
    isDrum: boolean,
  ) {
    // This assumes the synth stays in its default GS mode. A song that switches
    // it to XG or GM2 with a system exclusive can play another preset than the
    // one named here, since the names do not follow the song's events.
    if (this.parsed.presets.length === 0) {
      return undefined
    }
    return toSoundFontPreset(
      MIDIPatchTools.selectPatch(
        this.parsed.presets,
        {
          program: patch.programNumber,
          bankMSB: patch.bankMSB,
          bankLSB: patch.bankLSB,
          isGMGSDrum: isDrum,
        },
        DEFAULT_SYNTH_MODE,
        isDrum,
      ),
    )
  }

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
          const instRange = getKeyRange(
            instrumentZone,
            presetRange.min,
            presetRange.max,
          )
          const min = Math.max(presetRange.min, instRange.min)
          const max = Math.min(presetRange.max, instRange.max)
          // Sanity check
          if (min > max) {
            continue
          }

          const sampleName = instrumentZone.sample.name
          for (let key = min; key <= max; key++) {
            const samples = presetMeta.samples.get(key) ?? []
            samples.push({ name: sampleName })
            presetMeta.samples.set(key, samples)
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
    await BasicSoundBank.ready
    const parsed = SoundBankLoader.fromArrayBuffer(data)
    return new SoundFont(data, parsed)
  }
}
