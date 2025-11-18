const MINUTE = 60 * 1000000

export function uSecPerBeatToBPM(microsecondsPerBeat: number) {
  return MINUTE / microsecondsPerBeat
}

export function bpmToUSecPerBeat(bpm: number) {
  return MINUTE / bpm
}

export function tickToMillisec(tick: number, bpm: number, timebase: number) {
  return (tick / (timebase / 60) / bpm) * 1000
}
