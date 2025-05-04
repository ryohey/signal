import { Player } from "@signal-app/player"
import { autorun, computed, makeObservable } from "mobx"
import { TickTransform } from "../entities/transform/TickTransform"
import { SongStore } from "./SongStore"

interface TickScrollProvider {
  readonly transform: TickTransform
  readonly canvasWidth: number
  readonly autoScroll: boolean
  scrollLeftTicks: number
  scaleX: number
}

// Store for scrolling according to the playback time
export class TickScrollStore {
  constructor(
    readonly parent: TickScrollProvider,
    private readonly songStore: SongStore,
    private readonly player: Player,
    readonly minScaleX: number,
    readonly maxScaleX: number,
  ) {
    makeObservable(this, {
      scrollLeft: computed,
      playheadPosition: computed,
      playheadInScrollZone: computed,
    })
  }

  get scrollLeft(): number {
    return Math.round(this.parent.transform.getX(this.parent.scrollLeftTicks))
  }

  setUpAutoScroll() {
    autorun(() => {
      const { autoScroll } = this.parent
      const { isPlaying, position } = this.player
      const { playheadInScrollZone } = this
      if (autoScroll && isPlaying && playheadInScrollZone) {
        this.parent.scrollLeftTicks = position
      }
    })
  }

  get contentWidth(): number {
    const { transform, canvasWidth } = this.parent
    const trackEndTick = this.songStore.song.endOfSong
    const startTick = transform.getTick(this.scrollLeft)
    const widthTick = transform.getTick(canvasWidth)
    const endTick = startTick + widthTick
    return transform.getX(Math.max(trackEndTick, endTick))
  }

  get playheadPosition(): number {
    const { transform, scrollLeftTicks } = this.parent
    return transform.getX(this.player.position - scrollLeftTicks)
  }

  // Returns true if the user needs to scroll to comfortably view the playhead.
  get playheadInScrollZone(): boolean {
    const { canvasWidth } = this.parent
    return (
      this.playheadPosition < 0 || this.playheadPosition > canvasWidth * 0.7
    )
  }
}
