import { Player } from "@signal-app/player"
import { computed, makeObservable, observable } from "mobx"
import Quantizer from "../quantizer"
import { RulerStore } from "./RulerStore"
import { SongStore } from "./SongStore"
import { TickScrollStore } from "./TickScrollStore"

export default class TempoEditorStore {
  readonly rulerStore: RulerStore
  readonly tickScrollStore: TickScrollStore

  quantize = 4
  isQuantizeEnabled = true

  constructor(
    private readonly songStore: SongStore,
    player: Player,
  ) {
    this.tickScrollStore = new TickScrollStore(this.songStore, player, 0.15, 15)
    this.rulerStore = new RulerStore(this, this.tickScrollStore, this.songStore)

    makeObservable(this, {
      quantize: observable,
      isQuantizeEnabled: observable,
      quantizer: computed,
    })
  }

  setUpAutorun() {
    this.tickScrollStore.setUpAutoScroll()
  }

  get quantizer(): Quantizer {
    return new Quantizer(this.songStore, this.quantize, this.isQuantizeEnabled)
  }
}
