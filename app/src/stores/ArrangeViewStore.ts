import QuantizerStore from "./QuantizerStore"
import { SongStore } from "./SongStore"
import { TrackScrollStore } from "./TrackScrollStore"

export default class ArrangeViewStore {
  readonly trackScrollStore: TrackScrollStore
  readonly quantizerStore: QuantizerStore

  constructor(private readonly songStore: SongStore) {
    this.trackScrollStore = new TrackScrollStore(this.songStore)
    this.quantizerStore = new QuantizerStore(this.songStore, 1)
  }
}
