import { findLast } from "lodash"
import { createContext, useCallback, useContext, useMemo } from "react"
import { useUpdateTimeSignature } from "../actions"
import { Range } from "../entities/geometry/Range"
import { isEventInRange } from "../helpers/filterEvents"
import { RulerStore } from "../stores/RulerStore"
import { useMobxGetter } from "./useMobxSelector"
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

const RulerContext = createContext<RulerStore>(null!)
export const RulerProvider = RulerContext.Provider

export function useBeats(rulerStore: RulerStore = useContext(RulerContext)) {
  return useMobxGetter(rulerStore, "beats")
}

export function useRuler(rulerStore: RulerStore = useContext(RulerContext)) {
  const updateTimeSignature = useUpdateTimeSignature()
  const { transform, canvasWidth, scrollLeft } = useTickScroll()
  const { timeSignatures } = useSong()
  const beats = useBeats(rulerStore)
  const { quantizer } = useQuantizer()
  const selectedTimeSignatureEventIds = useMobxGetter(
    rulerStore,
    "selectedTimeSignatureEventIds",
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
            transform.getTick(canvasWidth),
          ),
        ),
      )
      .map((e) => {
        const x = transform.getX(e.tick)
        return {
          x,
          label: `${e.numerator}/${e.denominator}`,
          isSelected: selectedTimeSignatureEventIds.includes(e.id),
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
    (x: number) => {
      return findLast(
        rulerTimeSignatures,
        (e) => e.x < x && e.x + TIME_SIGNATURE_HIT_WIDTH >= x,
      )
    },
    [rulerTimeSignatures],
  )

  const getTick = useCallback(
    (offsetX: number) => transform.getTick(offsetX + scrollLeft),
    [transform, scrollLeft],
  )

  const getQuantizedTick = useCallback(
    (offsetX: number) => quantizer.round(getTick(offsetX)),
    [quantizer, getTick],
  )

  return {
    rulerBeats,
    timeSignatures: rulerTimeSignatures,
    get selectedTimeSignatureEventIds() {
      return useMobxGetter(rulerStore, "selectedTimeSignatureEventIds")
    },
    timeSignatureHitTest,
    selectTimeSignature: useCallback(
      (id: number) => {
        rulerStore.selectedTimeSignatureEventIds = [id]
      },
      [rulerStore],
    ),
    clearSelectedTimeSignature: useCallback(() => {
      rulerStore.selectedTimeSignatureEventIds = []
    }, [rulerStore]),
    updateTimeSignature: useCallback(
      (numerator: number, denominator: number) => {
        rulerStore.selectedTimeSignatureEventIds.forEach((id) => {
          updateTimeSignature(id, numerator, denominator)
        })
      },
      [rulerStore, updateTimeSignature],
    ),
    getQuantizedTick,
  }
}
