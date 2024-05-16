import { clamp, cloneDeep } from "lodash"
import { action, autorun, computed, makeObservable, observable } from "mobx"
import { IRect } from "../../common/geometry"
import { filterEventsOverlapScroll } from "../../common/helpers/filterEvents"
import Quantizer from "../../common/quantizer"
import { ArrangeSelection } from "../../common/selection/ArrangeSelection"
import { isNoteEvent } from "../../common/track"
import { NoteCoordTransform } from "../../common/transform"
import { ArrangeCoordTransform } from "../../common/transform/ArrangeCoordTransform"
import { Layout } from "../Constants"
import { BAR_WIDTH } from "../components/inputs/ScrollBar"
import RootStore from "./RootStore"
import { RulerStore } from "./RulerStore"

export type SerializedArrangeViewStore = Pick<
  ArrangeViewStore,
  "selection" | "selectedEventIds"
>

export default class ArrangeViewStore {
  readonly rulerStore: RulerStore

  scaleX = 1
  scaleY = 1
  SCALE_X_MIN = 0.15
  SCALE_X_MAX = 15
  SCALE_Y_MIN = 0.5
  SCALE_Y_MAX = 4
  selection: ArrangeSelection | null = null
  selectedEventIds: { [key: number]: number[] } = {} // { trackId: [eventId] }
  autoScroll = true
  quantize = 1
  scrollLeftTicks = 0
  scrollTop = 0
  canvasWidth = 0
  canvasHeight = 0
  selectedTrackId = 0
  openTransposeDialog = false

  constructor(readonly rootStore: RootStore) {
    this.rootStore = rootStore
    this.rulerStore = new RulerStore(this)

    makeObservable(this, {
      scaleX: observable,
      scaleY: observable,
      selection: observable.shallow,
      selectedEventIds: observable,
      autoScroll: observable,
      quantize: observable,
      scrollLeftTicks: observable,
      scrollTop: observable,
      canvasWidth: observable,
      canvasHeight: observable,
      selectedTrackId: observable,
      openTransposeDialog: observable,
      scrollLeft: computed,
      transform: computed,
      trackTransform: computed,
      playheadInScrollZone: computed,
      notes: computed,
      cursorX: computed,
      trackHeight: computed,
      selectionRect: computed,
      contentWidth: computed,
      contentHeight: computed,
      quantizer: computed,
      setScrollLeftInPixels: action,
      setScrollTop: action,
    })
  }

  setUpAutorun() {
    // keep scroll position to cursor
    autorun(() => {
      const { isPlaying, position } = this.rootStore.player
      const { autoScroll, playheadInScrollZone } = this
      if (autoScroll && isPlaying && playheadInScrollZone) {
        this.scrollLeftTicks = position
      }
    })
  }

  serialize(): SerializedArrangeViewStore {
    return {
      selection: cloneDeep(this.selection),
      selectedEventIds: cloneDeep(this.selectedEventIds),
    }
  }

  restore(state: SerializedArrangeViewStore) {
    this.selection = state.selection
    this.selectedEventIds = state.selectedEventIds
  }

  get scrollLeft(): number {
    return this.trackTransform.getX(this.scrollLeftTicks)
  }

  setScrollLeftInPixels(x: number) {
    const { canvasWidth, contentWidth } = this
    const maxOffset = Math.max(0, contentWidth - canvasWidth)
    const scrollLeft = Math.floor(Math.min(maxOffset, Math.max(0, x)))
    this.scrollLeftTicks = this.transform.getTicks(scrollLeft)
    if (this.playheadInScrollZone) {
      this.autoScroll = false
    }
  }

  setScrollTop(value: number) {
    const maxOffset =
      this.contentHeight + Layout.rulerHeight + BAR_WIDTH - this.canvasHeight
    this.scrollTop = clamp(value, 0, maxOffset)
  }

  scrollBy(x: number, y: number) {
    this.setScrollLeftInPixels(this.scrollLeft - x)
    this.setScrollTop(this.scrollTop - y)
  }

  scaleAroundPointX(scaleXDelta: number, pixelX: number) {
    const pixelXInTicks0 = this.transform.getTicks(this.scrollLeft + pixelX)
    this.scaleX = clamp(
      this.scaleX * (1 + scaleXDelta),
      this.SCALE_X_MIN,
      this.SCALE_X_MAX,
    )
    const pixelXInTicks1 = this.transform.getTicks(this.scrollLeft + pixelX)
    const scrollInTicks = pixelXInTicks1 - pixelXInTicks0
    this.scrollLeftTicks = Math.max(this.scrollLeftTicks - scrollInTicks, 0)
  }

  setScaleY(scaleY: number) {
    this.scaleY = clamp(scaleY, this.SCALE_Y_MIN, this.SCALE_Y_MAX)
    this.setScrollTop(this.scrollTop)
  }

  get contentWidth(): number {
    const { scrollLeft, transform, canvasWidth } = this
    const startTick = scrollLeft / transform.pixelsPerTick
    const widthTick = transform.getTicks(canvasWidth)
    const endTick = startTick + widthTick
    return (
      Math.max(this.rootStore.song.endOfSong, endTick) * transform.pixelsPerTick
    )
  }

  get contentHeight(): number {
    return this.trackHeight * this.rootStore.song.tracks.length
  }

  get transform(): NoteCoordTransform {
    return new NoteCoordTransform(
      Layout.pixelsPerTick * this.scaleX,
      0.5 * this.scaleY,
      127,
    )
  }

  get trackTransform(): ArrangeCoordTransform {
    const { transform, trackHeight } = this
    return new ArrangeCoordTransform(transform.pixelsPerTick, trackHeight)
  }

  get trackHeight(): number {
    const { transform } = this
    const bottomBorderWidth = 1
    return (
      Math.ceil(transform.pixelsPerKey * transform.numberOfKeys) +
      bottomBorderWidth
    )
  }

  get playheadPosition(): number {
    const position = this.rootStore.player.position
    return this.transform.getX(position - this.scrollLeftTicks)
  }

  // Returns true if the user needs to scroll to comfortably view the playhead.
  get playheadInScrollZone(): boolean {
    return (
      this.playheadPosition < 0 ||
      this.playheadPosition > this.canvasWidth * 0.7
    )
  }

  get notes(): IRect[] {
    const { transform, trackHeight } = this

    return this.rootStore.song.tracks
      .map((t, i) =>
        filterEventsOverlapScroll(
          t.events,
          transform.pixelsPerTick,
          this.scrollLeft,
          this.canvasWidth,
        )
          .filter(isNoteEvent)
          .map((e) => {
            const rect = transform.getRect(e)
            return { ...rect, height: this.scaleY, y: trackHeight * i + rect.y }
          }),
      )
      .flat()
  }

  get cursorX(): number {
    return this.transform.getX(this.rootStore.player.position)
  }

  get selectionRect(): IRect | null {
    const { selection, trackTransform } = this
    if (selection === null) {
      return null
    }
    const x = trackTransform.getX(selection.fromTick)
    const right = trackTransform.getX(selection.toTick)
    const y = trackTransform.getY(selection.fromTrackIndex)
    const bottom = trackTransform.getY(selection.toTrackIndex)
    return {
      x,
      width: right - x,
      y,
      height: bottom - y,
    }
  }

  get quantizer(): Quantizer {
    return new Quantizer(this.rootStore, this.quantize, true)
  }
}
