import { isEventInRange, Range } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import { findLast } from "lodash"
import { useCallback, useMemo } from "react"
import { useUpdateTimeSignature } from "../actions"
import { useBeats } from "./useBeats"
import { useQuantizer } from "./useQuantizer"
import { useSong } from "./useSong"
import { useTickScroll } from "./useTickScroll"

const TIME_SIGNATURE_HIT_WIDTH = 20

export interface RulerBeat {
  label: string | null
  x: number
  beat: number
}

export interface RulerTimeSignature {
  x: number
  label: string
  isSelected: boolean
}

export function useRuler() {
  const updateTimeSignature = useUpdateTimeSignature()
  const { transform, canvasWidth, scrollLeft } = useTickScroll()
  const { timeSignatures } = useSong()
  const beats = useBeats()
  const { quantizeRound } = useQuantizer()
  const selectedTimeSignatureEventIds = useAtomValue(
    selectedTimeSignatureEventIdsAtom
  )

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
            transform.getTick(canvasWidth)
          )
        )
      )
      .map((e) => {
        const x = transform.getX(e.tick)
        return {
          x,
          label: `${e.numerator}/${e.denominator}`,
          isSelected: selectedTimeSignatureEventIds.has(e.id),
          event: e,
        }
      })
  }, [
    scrollLeft,
    canvasWidth,
    transform,
    selectedTimeSignatureEventIds,
    timeSignatures,
  ])

  const timeSignatureHitTest = useCallback(
    (offsetX: number) => {
      const x = offsetX + scrollLeft
      return findLast(
        rulerTimeSignatures,
        (e) => e.x < x && e.x + TIME_SIGNATURE_HIT_WIDTH >= x
      )
    },
    [rulerTimeSignatures, scrollLeft]
  )

  const getTick = useCallback(
    (offsetX: number) => transform.getTick(offsetX + scrollLeft),
    [transform, scrollLeft]
  )

  const getQuantizedTick = useCallback(
    (offsetX: number) => quantizeRound(getTick(offsetX)),
    [quantizeRound, getTick]
  )

  return {
    rulerBeats,
    timeSignatures: rulerTimeSignatures,
    get selectedTimeSignatureEventIds() {
      return useAtomValue(selectedTimeSignatureEventIdsAtom)
    },
    timeSignatureHitTest,
    selectTimeSignature: useSetAtom(selectTimeSignatureAtom),
    clearSelectedTimeSignature: useSetAtom(clearSelectedTimeSignatureAtom),
    updateTimeSignature: useAtomCallback(
      useCallback(
        (get, _set, numerator: number, denominator: number) => {
          get(selectedTimeSignatureEventIdsAtom).forEach((id) => {
            updateTimeSignature(id, numerator, denominator)
          })
        },
        [updateTimeSignature]
      )
    ),
    getQuantizedTick,
  }
}

// atoms
const selectedTimeSignatureEventIdsAtom = atom(new Set<number>())

// actions
const selectTimeSignatureAtom = atom(null, (_get, set, id: number) => {
  set(selectedTimeSignatureEventIdsAtom, new Set([id]))
})
const clearSelectedTimeSignatureAtom = atom(null, (_get, set) => {
  set(selectedTimeSignatureEventIdsAtom, new Set())
})
