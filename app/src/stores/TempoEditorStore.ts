import { Player } from "@signal-app/player"
import { computed, makeObservable, observable } from "mobx"
import { TempoSelection } from "../entities/selection/TempoSelection"
import { TempoCoordTransform } from "../entities/transform/TempoCoordTransform"
import { PianoRollMouseMode } from "./PianoRollStore"
import QuantizerStore from "./QuantizerStore"
import { RulerStore } from "./RulerStore"
import { SongStore } from "./SongStore"
import { TickScrollStore } from "./TickScrollStore"

export default class TempoEditorStore {
  readonly rulerStore: RulerStore
  readonly tickScrollStore: TickScrollStore
  readonly quantizerStore: QuantizerStore

  canvasHeight: number = 0
  mouseMode: PianoRollMouseMode = "pencil"
  selection: TempoSelection | null = null
  selectedEventIds: number[] = []

  constructor(
    private readonly songStore: SongStore,
    player: Player,
  ) {
    this.tickScrollStore = new TickScrollStore(this.songStore, player, 0.15, 15)
    this.rulerStore = new RulerStore(this.tickScrollStore, this.songStore)
    this.quantizerStore = new QuantizerStore(this.songStore)

    makeObservable(this, {
      canvasHeight: observable,
      mouseMode: observable,
      selection: observable,
      selectedEventIds: observable,
      transform: computed,
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
}
