import { computed, makeObservable, observable } from "mobx"
import { BeatWithX } from "../entities/beat/BeatWithX"
import { TickTransform } from "../entities/transform/TickTransform"
import Quantizer from "../quantizer"
import { SongStore } from "./SongStore"

interface RulerProvider {
  transform: TickTransform
  scrollLeft: number
  canvasWidth: number
  quantizer: Quantizer
}

export class RulerStore {
  selectedTimeSignatureEventIds: number[] = []

  constructor(
    readonly parent: RulerProvider,
    private readonly songStore: SongStore,
  ) {
    makeObservable(this, {
      selectedTimeSignatureEventIds: observable.shallow,
      beats: computed,
    })
  }

  get beats(): BeatWithX[] {
    const { scrollLeft, transform, canvasWidth } = this.parent
    const {
      song: { measures, timebase },
    } = this.songStore

    return BeatWithX.createInRange(
      measures,
      transform,
      timebase,
      scrollLeft,
      canvasWidth,
    )
  }
}
