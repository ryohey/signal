import { isEventInRange, Range } from "@signal-app/core"
import { useCallback, useMemo, useState, useSyncExternalStore } from "react"
import { useBeats } from "./useBeats"
import { useSong } from "./useSong"
import { useTickScroll } from "./useTickScroll"

export interface RulerBeat {
  label: string | null
  x: number
  beat: number
}

export interface RulerTimeSignature {
  id: number
  x: number
  denominator: number
  numerator: number
  isSelected: boolean
}

const noop = () => () => {}

function useTimeSignatures() {
  const { conductorTrack } = useSong()
  return useSyncExternalStore(
    conductorTrack?.onTimeSignatureEventsChanged.subscribe ?? noop,
    useCallback(
      () => conductorTrack?.timeSignatureEvents ?? [],
      [conductorTrack],
    ),
  )
}

export function useRuler() {
  const { transform, canvasWidth, scrollLeft } = useTickScroll()
  const timeSignatures = useTimeSignatures()
  const beats = useBeats()
  const [selectedTimeSignatureEventIds, setSelectedTimeSignatureEventIds] =
    useState<Set<number>>(new Set())

  const selectTimeSignature = useCallback((id: number) => {
    setSelectedTimeSignatureEventIds(new Set([id]))
  }, [])

  const clearSelectedTimeSignature = useCallback(() => {
    setSelectedTimeSignatureEventIds(new Set())
  }, [])

  const rulerBeats = useMemo(() => {
    const result: RulerBeat[] = []

    // 密過ぎる時は省略する
    const shouldOmit = beats.length > 1 && beats[1].x - beats[0].x <= 5

    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i]
      if (beat.beat === 0 || !shouldOmit) {
        result.push({
          // 小節番号
          // 省略時は2つに1つ描画
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

  const rulerTimeSignatures = useMemo(() => {
    return timeSignatures
      .filter(
        isEventInRange(
          Range.fromLength(
            transform.getTick(scrollLeft),
            transform.getTick(canvasWidth),
          ),
        ),
      )
      .map((e) => {
        const x = transform.getX(e.tick)
        return {
          id: e.id,
          x,
          numerator: e.numerator,
          denominator: e.denominator,
          isSelected: selectedTimeSignatureEventIds.has(e.id),
        }
      })
  }, [
    scrollLeft,
    canvasWidth,
    transform,
    selectedTimeSignatureEventIds,
    timeSignatures,
  ])

  return {
    rulerBeats,
    timeSignatures: rulerTimeSignatures,
    selectedTimeSignatureEventIds,
    selectTimeSignature,
    clearSelectedTimeSignature,
  }
}
