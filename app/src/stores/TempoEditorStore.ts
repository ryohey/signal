import { computed, makeObservable, observable } from "mobx"
import { Layout } from "../Constants"
import { transformEvents } from "../components/TempoGraph/transformEvents"
import { Point } from "../entities/geometry/Point"
import { Rect } from "../entities/geometry/Rect"
import { TempoSelection } from "../entities/selection/TempoSelection"
import { TempoCoordTransform } from "../entities/transform/TempoCoordTransform"
import Quantizer from "../quantizer"
import { PianoRollMouseMode } from "./PianoRollStore"
import RootStore from "./RootStore"
import { RulerStore } from "./RulerStore"
import { TickScrollStore } from "./TickScrollStore"

export default class TempoEditorStore {
  readonly rulerStore: RulerStore
  private readonly tickScrollStore: TickScrollStore

  scrollLeftTicks: number = 0
  scaleX: number = 1
  autoScroll: boolean = true
  canvasWidth: number = 0
  canvasHeight: number = 0
  quantize = 4
  isQuantizeEnabled = true
  mouseMode: PianoRollMouseMode = "pencil"
  selection: TempoSelection | null = null
  selectedEventIds: number[] = []

  constructor(readonly rootStore: RootStore) {
    this.rulerStore = new RulerStore(this, rootStore.songStore)
    this.tickScrollStore = new TickScrollStore(this, 0.15, 15)

    makeObservable(this, {
      scrollLeftTicks: observable,
      scaleX: observable,
      autoScroll: observable,
      canvasWidth: observable,
      canvasHeight: observable,
      quantize: observable,
      isQuantizeEnabled: observable,
      mouseMode: observable,
      selection: observable,
      selectedEventIds: observable,
      scrollLeft: computed,
      transform: computed,
      items: computed,
      cursorX: computed,
      contentWidth: computed,
      controlPoints: computed,
      selectionRect: computed,
      quantizer: computed,
    })
  }

  setUpAutorun() {
    this.tickScrollStore.setUpAutoScroll()
  }

  setScrollLeftInPixels(x: number) {
    this.tickScrollStore.setScrollLeftInPixels(x)
  }

  get scrollLeft(): number {
    return this.tickScrollStore.scrollLeft
  }

  get transform() {
    const pixelsPerTick = Layout.pixelsPerTick * this.scaleX
    return new TempoCoordTransform(pixelsPerTick, this.canvasHeight)
  }

  get cursorX(): number {
    return this.transform.getX(this.rootStore.player.position)
  }

  get items() {
    const { transform, canvasWidth, scrollLeft } = this
    const events = this.rootStore.song.conductorTrack?.events ?? []
    return transformEvents(events, transform, canvasWidth + scrollLeft)
  }

  get contentWidth() {
    return this.tickScrollStore.contentWidth
  }

  get quantizer(): Quantizer {
    return new Quantizer(this.rootStore, this.quantize, this.isQuantizeEnabled)
  }

  // draggable hit areas for each tempo changes
  get controlPoints() {
    const { items } = this
    const circleRadius = 4
    return items.map((p) => ({
      ...pointToCircleRect(p.bounds, circleRadius),
      id: p.id,
    }))
  }

  get selectionRect() {
    const { selection, transform } = this
    return selection != null
      ? TempoSelection.getBounds(selection, transform)
      : null
  }

  hitTest(point: Point): number | undefined {
    return this.controlPoints.find((r) => Rect.containsPoint(r, point))?.id
  }
}

export const pointToCircleRect = (p: Point, radius: number) => ({
  x: p.x - radius,
  y: p.y - radius,
  width: radius * 2,
  height: radius * 2,
})
