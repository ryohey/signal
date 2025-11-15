import { computed, makeObservable } from "mobx"
import { BeatWithX } from "../entities/beat/BeatWithX"
import { SongStore } from "./SongStore"
import { TickScrollStore } from "./TickScrollStore"

export class RulerStore {
  constructor(
    private readonly tickScrollStore: TickScrollStore,
    private readonly songStore: SongStore,
  ) {
    makeObservable(this, {
      beats: computed,
    })
  }

  get beats(): BeatWithX[] {
    const { scrollLeft, transform, canvasWidth } = this.tickScrollStore
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
