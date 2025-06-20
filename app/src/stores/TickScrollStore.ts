import { Player } from "/imports/signal/packages/player/src"
import { clamp } from "lodash"
import { autorun, computed, makeObservable } from "mobx"
import { TickTransform } from "../entities/transform/TickTransform"
import Song from "../song"

interface TickScrollProvider {
  readonly rootStore: { song: Song; player: Player }
  readonly transform: TickTransform
  readonly canvasWidth: number
  readonly autoScroll: boolean
  scrollLeftTicks: number
  scaleX: number
}

// Store for scrolling according to the playback time
export class TickScrollStore {
  constructor(
    private readonly parent: TickScrollProvider,
    private readonly minScaleX: number,
    private readonly maxScaleX: number
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
      const {
        autoScroll,
        rootStore: { player },
      } = this.parent
      const { isPlaying, position } = player
      const { playheadInScrollZone } = this
      if (autoScroll && isPlaying && playheadInScrollZone) {
        this.parent.scrollLeftTicks = position
      }
    })
  }

  setScrollLeftInPixels(x: number) {
    const { contentWidth } = this
    const { transform, canvasWidth } = this.parent
    const maxX = contentWidth - canvasWidth
    const scrollLeft = clamp(x, 0, maxX)
    this.parent.scrollLeftTicks = transform.getTick(scrollLeft)
  }

  // Unlike scrollLeft = tick, this method keeps the scroll position within the content area
  setScrollLeftInTicks(tick: number) {
    this.setScrollLeftInPixels(this.parent.transform.getX(tick))
  }

  get contentWidth(): number {
    const { transform, canvasWidth } = this.parent
    const trackEndTick = this.parent.rootStore.song.endOfSong
    const startTick = transform.getTick(this.scrollLeft)
    const widthTick = transform.getTick(canvasWidth)
    const endTick = startTick + widthTick
    return transform.getX(Math.max(trackEndTick, endTick))
  }

  scaleAroundPointX(scaleXDelta: number, pixelX: number) {
    const { maxScaleX, minScaleX } = this
    const pixelXInTicks0 = this.parent.transform.getTick(
      this.scrollLeft + pixelX
    )
    this.parent.scaleX = clamp(
      this.parent.scaleX * (1 + scaleXDelta),
      minScaleX,
      maxScaleX
    )
    const pixelXInTicks1 = this.parent.transform.getTick(
      this.scrollLeft + pixelX
    )
    const scrollInTicks = pixelXInTicks1 - pixelXInTicks0
    this.setScrollLeftInTicks(this.parent.scrollLeftTicks - scrollInTicks)
  }

  get playheadPosition(): number {
    const {
      transform,
      scrollLeftTicks,
      rootStore: { player },
    } = this.parent
    return transform.getX(player.position - scrollLeftTicks)
  }

  // Returns true if the user needs to scroll to comfortably view the playhead.
  get playheadInScrollZone(): boolean {
    const { canvasWidth } = this.parent
    return (
      this.playheadPosition < 0 || this.playheadPosition > canvasWidth * 0.7
    )
  }
}
