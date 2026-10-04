import { Measure } from "@signal-app/core"
import { useCallback } from "react"
import { usePianoRollTickScroll } from "../features/piano-roll/hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"

export const useStop = () => {
  const { setScrollLeftInTicks } = usePianoRollTickScroll()
  const { stop, setPosition } = usePlayer()

  return useCallback(() => {
    stop()
    setPosition(0)
    setScrollLeftInTicks(0)
  }, [stop, setPosition, setScrollLeftInTicks])
}

export const useRewindOneBar = () => {
  const { measures, timebase } = useSong()
  const { scrollLeftTicks, setScrollLeftInTicks } = usePianoRollTickScroll()
  const { position, setPosition } = usePlayer()

  const getPreviousMeasureTick = useCallback(
    (position: number) =>
      Measure.getPreviousMeasureTick(measures, position, timebase),
    [measures, timebase],
  )

  return useCallback(() => {
    const tick = getPreviousMeasureTick(position)
    setPosition(tick)

    // make sure player doesn't move out of sight to the left
    if (tick < scrollLeftTicks) {
      setScrollLeftInTicks(tick)
    }
  }, [
    getPreviousMeasureTick,
    position,
    scrollLeftTicks,
    setPosition,
    setScrollLeftInTicks,
  ])
}

export const useFastForwardOneBar = () => {
  const { transform, scrollLeft, canvasWidth, setScrollLeftInPixels } =
    usePianoRollTickScroll()
  const { measures, timebase } = useSong()
  const { position, setPosition } = usePlayer()

  const getNextMeasureTick = useCallback(
    (position: number) =>
      Measure.getNextMeasureTick(measures, position, timebase),
    [measures, timebase],
  )

  return useCallback(() => {
    const tick = getNextMeasureTick(position)
    setPosition(tick)

    // make sure player doesn't move out of sight to the right
    const x = transform.getX(tick)
    const screenX = x - scrollLeft
    if (screenX > canvasWidth * 0.7) {
      setScrollLeftInPixels(x - canvasWidth * 0.7)
    }
  }, [
    getNextMeasureTick,
    position,
    transform,
    scrollLeft,
    canvasWidth,
    setPosition,
    setScrollLeftInPixels,
  ])
}
