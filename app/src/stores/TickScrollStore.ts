import { Player } from "@signal-app/player"
import { autorun, computed, makeObservable, observable } from "mobx"
import { Layout } from "../Constants"
import { TickTransform } from "../entities/transform/TickTransform"
import { SongStore } from "./SongStore"

// Store for scrolling according to the playback time
export class TickScrollStore {
  scrollLeftTicks = 0
  scaleX = 1
  autoScroll = true
  canvasWidth = 0

  constructor(
    private readonly songStore: SongStore,
    private readonly player: Player,
    readonly minScaleX: number,
    readonly maxScaleX: number,
  ) {
    makeObservable(this, {
      autoScroll: observable,
      canvasWidth: observable,
      scaleX: observable,
      scrollLeftTicks: observable,
      transform: computed,
      scrollLeft: computed,
      playheadPosition: computed,
      playheadInScrollZone: computed,
    })
  }

  get transform(): TickTransform {
    return new TickTransform(Layout.pixelsPerTick * this.scaleX)
  }

  get scrollLeft(): number {
    return Math.round(this.transform.getX(this.scrollLeftTicks))
  }

  setUpAutoScroll() {
    autorun(() => {
      const { isPlaying, position } = this.player
      const { autoScroll, playheadInScrollZone } = this
      if (autoScroll && isPlaying && playheadInScrollZone) {
        this.scrollLeftTicks = position
      }
    })
  }

  get contentWidth(): number {
    const { transform, canvasWidth, scrollLeft } = this
    const trackEndTick = this.songStore.song.endOfSong
    const startTick = transform.getTick(scrollLeft)
    const widthTick = transform.getTick(canvasWidth)
    const endTick = startTick + widthTick
    return transform.getX(Math.max(trackEndTick, endTick))
  }

  get playheadPosition(): number {
    const { transform, scrollLeftTicks } = this
    return transform.getX(this.player.position - scrollLeftTicks)
  }

  // Returns true if the user needs to scroll to comfortably view the playhead.
  get playheadInScrollZone(): boolean {
    const { canvasWidth } = this
    return (
      this.playheadPosition < 0 || this.playheadPosition > canvasWidth * 0.7
    )
  }
}
