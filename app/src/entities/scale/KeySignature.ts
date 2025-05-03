import { Scale } from "./Scale"

export interface KeySignature {
  readonly key: number // 0 is C, 1 is C#, 2 is D, etc.
  readonly scale: Scale
}

export namespace KeySignature {
  // the function that transpose the scale to the key
  export const getIntervals = (keySignature: KeySignature): number[] => {
    const scaleIntervals = Scale.getIntegerNotation(keySignature.scale)
    return scaleIntervals.map((i) => (i + keySignature.key) % 12)
  }
}
