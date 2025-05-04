import { Player } from "@signal-app/player"
import { computed, makeObservable, observable } from "mobx"
import { transformEvents } from "../components/TempoGraph/transformEvents"
import { Point } from "../entities/geometry/Point"
import { TempoSelection } from "../entities/selection/TempoSelection"
import { TempoCoordTransform } from "../entities/transform/TempoCoordTransform"
import Quantizer from "../quantizer"
import { PianoRollMouseMode } from "./PianoRollStore"
import { RulerStore } from "./RulerStore"
import { SongStore } from "./SongStore"
import { TickScrollStore } from "./TickScrollStore"

export default class TempoEditorStore {
  readonly rulerStore: RulerStore
  readonly tickScrollStore: TickScrollStore

  canvasHeight: number = 0
  quantize = 4
  isQuantizeEnabled = true
  mouseMode: PianoRollMouseMode = "pencil"
  selection: TempoSelection | null = null
  selectedEventIds: number[] = []

  constructor(
    private readonly songStore: SongStore,
    private readonly player: Player,
  ) {
    this.tickScrollStore = new TickScrollStore(
      this.songStore,
      this.player,
      0.15,
      15,
    )
    this.rulerStore = new RulerStore(this, this.tickScrollStore, this.songStore)

    makeObservable(this, {
      canvasHeight: observable,
      quantize: observable,
      isQuantizeEnabled: observable,
      mouseMode: observable,
      selection: observable,
      selectedEventIds: observable,
      transform: computed,
      items: computed,
      controlPoints: computed,
      quantizer: computed,
    })
  }

  setUpAutorun() {
    this.tickScrollStore.setUpAutoScroll()
  }

  get transform() {
    return new TempoCoordTransform(
      this.tickScrollStore.transform,
      this.canvasHeight,
    )
  }

  get items() {
    const { transform } = this
    const { canvasWidth, scrollLeft } = this.tickScrollStore
    const events = this.songStore.song.conductorTrack?.events ?? []
    return transformEvents(events, transform, canvasWidth + scrollLeft)
  }

  get quantizer(): Quantizer {
    return new Quantizer(this.songStore, this.quantize, this.isQuantizeEnabled)
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
}

export const pointToCircleRect = (p: Point, radius: number) => ({
  x: p.x - radius,
  y: p.y - radius,
  width: radius * 2,
  height: radius * 2,
})
