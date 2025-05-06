import { Player } from "@signal-app/player"
import { computed, makeObservable, observable } from "mobx"
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

  get quantizer(): Quantizer {
    return new Quantizer(this.songStore, this.quantize, this.isQuantizeEnabled)
  }
}
