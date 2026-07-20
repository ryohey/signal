import { Measure } from "../measure/Measure"
import { Song } from "./Song"

export const getMeasureStartTick = (tick: number) => (song: Song) => {
  const { timebase, measures } = song
  return Measure.getMeasureStart(measures, tick, timebase).tick
}
