import { useMemo } from "react"
import { useBeats } from "../../../hooks/useBeats"

export interface RulerBeat {
  label: string | null
  x: number
  beat: number
}

export function useRulerBeats() {
  const beats = useBeats()

  return useMemo(() => {
    const result: RulerBeat[] = []

    // Omit beats if they are too dense
    const shouldOmit = beats.length > 1 && beats[1].x - beats[0].x <= 5

    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i]
      if (beat.beat === 0 || !shouldOmit) {
        result.push({
          // Measure number
          // Omit odd measures when too dense
          label:
            beat.beat === 0 && (!shouldOmit || beat.measure % 2 === 0)
              ? `${beat.measure + 1}`
              : null,
          x: beat.x,
          beat: beat.beat,
        })
      }
    }
    return result
  }, [beats])
}
