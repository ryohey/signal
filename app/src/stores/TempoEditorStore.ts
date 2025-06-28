import { Player } from "@signal-app/player"
import QuantizerStore from "./QuantizerStore"
import { RulerStore } from "./RulerStore"
import { SongStore } from "./SongStore"
import { TickScrollStore } from "./TickScrollStore"

export default class TempoEditorStore {
  readonly rulerStore: RulerStore
  readonly tickScrollStore: TickScrollStore
  readonly quantizerStore: QuantizerStore

  constructor(
    private readonly songStore: SongStore,
    player: Player,
  ) {
    this.tickScrollStore = new TickScrollStore(this.songStore, player, 0.15, 15)
    this.rulerStore = new RulerStore(this.tickScrollStore, this.songStore)
    this.quantizerStore = new QuantizerStore(this.songStore)
  }
}
