import { computed, makeObservable, observable } from "mobx"
import Quantizer from "../quantizer"
import { SongStore } from "./SongStore"

export default class QuantizerStore {
  quantize = 4
  isQuantizeEnabled = true

  constructor(
    private readonly songStore: SongStore,
    quantize = 4,
    isQuantizeEnabled = true,
  ) {
    this.quantize = quantize
    this.isQuantizeEnabled = isQuantizeEnabled

    makeObservable(this, {
      quantize: observable,
      isQuantizeEnabled: observable,
      quantizer: computed,
      enabledQuantizer: computed,
    })
  }

  get quantizer(): Quantizer {
    return new Quantizer(this.songStore, this.quantize, this.isQuantizeEnabled)
  }

  get enabledQuantizer(): Quantizer {
    return new Quantizer(this.songStore, this.quantize, true)
  }
}
