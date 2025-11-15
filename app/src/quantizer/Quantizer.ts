import { Measure } from "../entities/measure/Measure"
import { SongStore } from "../stores/SongStore"

export interface QuantizeOption {
  force: true
}

export default class Quantizer {
  private denominator: number
  private songStore: SongStore
  private isEnabled: boolean = true

  constructor(songStore: SongStore, denominator: number, isEnabled: boolean) {
    this.songStore = songStore

    // N 分音符の N
    // n-remnant note n
    this.denominator = denominator

    this.isEnabled = isEnabled
  }

  private get timebase() {
    return this.songStore.song.timebase
  }

  private calc(
    tick: number,
    fn: (tick: number) => number,
    option?: QuantizeOption,
  ) {
    if (option?.force !== true && !this.isEnabled) {
      return Math.round(tick)
    }
    const measureStart = Measure.getMeasureStart(
      this.songStore.song.measures,
      tick,
      this.songStore.song.timebase,
    )
    const beats = this.denominator === 1 ? (measureStart.numerator ?? 4) : 4
    const u = (this.timebase * beats) / this.denominator
    const offset = measureStart?.tick ?? 0
    return fn((tick - offset) / u) * u + offset
  }

  round(tick: number, option?: QuantizeOption) {
    return this.calc(tick, Math.round, option)
  }

  ceil(tick: number, option?: QuantizeOption) {
    return this.calc(tick, Math.ceil, option)
  }

  floor(tick: number, option?: QuantizeOption) {
    return this.calc(tick, Math.floor, option)
  }

  get unit() {
    return (this.timebase * 4) / this.denominator
  }
}
