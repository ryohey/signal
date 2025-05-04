import { clamp } from "lodash"
import { computed, makeObservable, observable } from "mobx"
import { BAR_WIDTH } from "../components/inputs/ScrollBar"
import { Layout } from "../Constants"
import { TrackTransform } from "../entities/transform/TrackTransform"
import { SongStore } from "./SongStore"

const SCALE_Y_MIN = 0.5
const SCALE_Y_MAX = 4
const DEFAULT_TRACK_HEIGHT = 64

export class TrackScrollStore {
  canvasHeight = 0
  scrollTop = 0
  scaleY = 1

  constructor(private readonly songStore: SongStore) {
    makeObservable(this, {
      canvasHeight: observable,
      scrollTop: observable,
      scaleY: observable,
      contentHeight: computed,
      trackHeight: computed,
      transform: computed,
    })
  }

  get transform() {
    const { trackHeight } = this
    return new TrackTransform(trackHeight)
  }

  get contentHeight(): number {
    return this.transform.getY(this.songStore.song.tracks.length)
  }

  get trackHeight(): number {
    const { scaleY } = this
    return DEFAULT_TRACK_HEIGHT * scaleY
  }

  setScrollTop(value: number) {
    const maxOffset =
      this.contentHeight + Layout.rulerHeight + BAR_WIDTH - this.canvasHeight
    this.scrollTop = clamp(value, 0, maxOffset)
  }

  setScaleY(scaleY: number) {
    this.scaleY = clamp(scaleY, SCALE_Y_MIN, SCALE_Y_MAX)
    this.setScrollTop(this.scrollTop)
  }
}
