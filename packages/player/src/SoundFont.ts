import { getSampleEventsFromSoundFont } from "@ryohey/wavelet"

interface PresetMeta {
  name: string
  samples: Map<number, SampleMeta[]> // noteNumber -> SampleMeta[]
}

interface SampleMeta {
  name: string
}

export class SoundFont {
  constructor(
    readonly data: ArrayBuffer,
    readonly sampleEvents: Awaited<
      ReturnType<typeof getSampleEventsFromSoundFont>
    >,
  ) {}

  getDrumKitPresets() {
    const drumKitPresets: Map<number, PresetMeta> = new Map() // programNumber -> PresetMeta

    for (const eventWrapper of this.sampleEvents) {
      const event = eventWrapper.event

      if (event.type === "sampleParameter") {
        const { parameter, range } = event
        const programNumber = range.instrument // GM patch number
        const keyStart = range.keyRange[0]
        const keyEnd = range.keyRange[1]

        // Check if this is a drum kit
        const isDrumKit = range.bank === 128

        if (!isDrumKit) {
          continue // Skip non-drum kit presets
        }

        // Create preset if it doesn't exist
        if (!drumKitPresets.has(programNumber)) {
          drumKitPresets.set(programNumber, {
            name: `Drum Kit ${programNumber}`,
            samples: new Map(),
          })
        }

        const preset = drumKitPresets.get(programNumber)!

        // Add sample metadata for each key in the range
        for (let key = keyStart; key <= keyEnd; key++) {
          if (!preset.samples.has(key)) {
            preset.samples.set(key, [])
          }

          const sampleMeta: SampleMeta = {
            name: parameter.name,
          }

          preset.samples.get(key)!.push(sampleMeta)
        }
      }
    }
    return drumKitPresets
  }

  static async loadFromURL(url: string) {
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    return await this.load(data)
  }

  static async load(data: ArrayBuffer) {
    const sampleEvents = getSampleEventsFromSoundFont(new Uint8Array(data))

    return new SoundFont(data, sampleEvents)
  }
}
