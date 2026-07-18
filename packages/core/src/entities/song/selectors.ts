import { Measure } from "../measure/Measure"
import { Song } from "./Song"

export const getMeasureStartTick = (song: Song) => (tick: number) => {
  const { timebase, measures } = song
  return Measure.getMeasureStart(measures, tick, timebase).tick
}
