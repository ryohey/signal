import { findLast } from "lodash"
import { useCallback, useMemo } from "react"
import { useUpdateTimeSignature } from "../actions"
import { Range } from "../entities/geometry/Range"
import { isEventInRange } from "../helpers/filterEvents"
import { RulerStore } from "../stores/RulerStore"
import { useMobxSelector, useMobxStore } from "./useMobxSelector"
import { usePlayer } from "./usePlayer"

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

export function useRuler(rulerStore: RulerStore) {
  const updateTimeSignature = useUpdateTimeSignature()
  const { parent } = rulerStore

  const transform = useMobxSelector(() => parent.transform, [parent])
  const timeSignatures = useMobxStore(({ song }) => song.timeSignatures)
  const beats = useMobxSelector(() => rulerStore.beats, [rulerStore])
  const quantizer = useMobxSelector(() => parent.quantizer, [parent])
  const canvasWidth = useMobxSelector(() => parent.canvasWidth, [parent])
  const scrollLeft = useMobxSelector(() => parent.scrollLeft, [parent])
  const selectedTimeSignatureEventIds = useMobxSelector(
    () => rulerStore.selectedTimeSignatureEventIds,
    [rulerStore],
  )
  const { loop, setLoopBegin, setLoopEnd, setPosition } = usePlayer()

  const timeSignatureHitTest = useCallback(
    (tick: number) => {
      const widthTick = transform.getTick(TIME_SIGNATURE_HIT_WIDTH)
      return findLast(
        timeSignatures,
        (e) => e.tick < tick && e.tick + widthTick >= tick,
      )
    },
    [timeSignatures, transform],
  )

  const rulerBeats = useMemo(() => {
    const result: RulerBeat[] = []

    // 密過ぎる時は省略する
    const shouldOmit = beats.length > 1 && beats[1].x - beats[0].x <= 5

    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i]
      const x = transform.getX(beat.tick)
      if (beat.beat === 0 || !shouldOmit) {
        result.push({
          // 小節番号
          // 省略時は2つに1つ描画
          label:
            beat.beat === 0 && (!shouldOmit || beat.measure % 2 === 0)
              ? `${beat.measure + 1}`
              : null,
          x,
          beat: beat.beat,
        })
      }
    }
    return result
  }, [beats, transform])

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
        }
      })
  }, [
    scrollLeft,
    canvasWidth,
    transform,
    selectedTimeSignatureEventIds,
    timeSignatures,
  ])

  const getTick = useCallback(
    (offsetX: number) => transform.getTick(offsetX + scrollLeft),
    [transform, scrollLeft],
  )

  const getQuantizedTick = useCallback(
    (offsetX: number) => quantizer.round(getTick(offsetX)),
    [quantizer, getTick],
  )

  return {
    canvasWidth,
    scrollLeft,
    beats: rulerBeats,
    loop,
    timeSignatures: rulerTimeSignatures,
    transform,
    timeSignatureHitTest,
    setLoopBegin,
    setLoopEnd,
    seek: setPosition,
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
    getTick,
    getQuantizedTick,
  }
}
