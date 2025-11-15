import { Player } from "@signal-app/player"
import { computed, makeObservable } from "mobx"
import { MaxNoteNumber } from "../Constants"
import { ArrangeCoordTransform } from "../entities/transform/ArrangeCoordTransform"
import { KeyTransform } from "../entities/transform/KeyTransform"
import { NoteCoordTransform } from "../entities/transform/NoteCoordTransform"
import QuantizerStore from "./QuantizerStore"
import { RulerStore } from "./RulerStore"
import { SongStore } from "./SongStore"
import { TickScrollStore } from "./TickScrollStore"
import { TrackScrollStore } from "./TrackScrollStore"

export default class ArrangeViewStore {
  readonly rulerStore: RulerStore
  readonly tickScrollStore: TickScrollStore
  readonly trackScrollStore: TrackScrollStore
  readonly quantizerStore: QuantizerStore

  constructor(
    private readonly songStore: SongStore,
    player: Player,
  ) {
    this.tickScrollStore = new TickScrollStore(this.songStore, player, 0.15, 15)
    this.trackScrollStore = new TrackScrollStore(this.songStore)
    this.rulerStore = new RulerStore(this.tickScrollStore, this.songStore)
    this.quantizerStore = new QuantizerStore(this.songStore, 1)

    makeObservable(this, {
      transform: computed,
      trackTransform: computed,
    })
  }

  get transform(): NoteCoordTransform {
    const bottomBorderWidth = 1
    const keyTransform = new KeyTransform(
      (this.trackScrollStore.trackHeight - bottomBorderWidth) / MaxNoteNumber,
      MaxNoteNumber,
    )
    return new NoteCoordTransform(this.tickScrollStore.transform, keyTransform)
  }

  get trackTransform(): ArrangeCoordTransform {
    const { transform } = this.tickScrollStore
    const { transform: trackTransform } = this.trackScrollStore
    return new ArrangeCoordTransform(transform, trackTransform)
  }
}
