import { findLast } from "lodash"
import { useCallback, useMemo } from "react"
import { useUpdateTimeSignature } from "../actions"
import { RulerStore } from "../stores/RulerStore"
import { useMobxSelector, useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

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
  const { player } = useStores()
  const updateTimeSignature = useUpdateTimeSignature()

  const transform = useMobxSelector(
    useCallback(() => rulerStore.parent.transform, [rulerStore]),
  )
  const timeSignatures = useMobxSelector(
    useCallback(() => rulerStore.timeSignatures, [rulerStore]),
  )
  const beats = useMobxSelector(
    useCallback(() => rulerStore.beats, [rulerStore]),
  )
  const quantizer = useMobxSelector(
    useCallback(() => rulerStore.quantizer, [rulerStore]),
  )
  const canvasWidth = useMobxSelector(
    useCallback(() => rulerStore.parent.canvasWidth, [rulerStore]),
  )
  const scrollLeft = useMobxSelector(
    useCallback(() => rulerStore.parent.scrollLeft, [rulerStore]),
  )
  const selectedTimeSignatureEventIds = useMobxSelector(
    useCallback(() => rulerStore.selectedTimeSignatureEventIds, [rulerStore]),
  )
  const loop = useMobxStore(({ player }) => player.loop)

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

    for (let i = 0; i < rulerStore.beats.length; i++) {
      const beat = rulerStore.beats[i]
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
  }, [rulerStore.beats, transform])

  const rulerTimeSignatures = useMemo(() => {
    return timeSignatures.map((e) => {
      const x = transform.getX(e.tick)
      return {
        x,
        label: `${e.numerator}/${e.denominator}`,
        isSelected: selectedTimeSignatureEventIds.includes(e.id),
      }
    })
  }, [timeSignatures, transform, selectedTimeSignatureEventIds])

  return {
    canvasWidth,
    scrollLeft,
    beats: rulerBeats,
    loop,
    timeSignatures: rulerTimeSignatures,
    quantizer,
    transform,
    timeSignatureHitTest,
    setLoopBegin: (tick: number) => player.setLoopBegin(tick),
    setLoopEnd: (tick: number) => player.setLoopEnd(tick),
    seek: (tick: number) => {
      player.position = tick
    },
    selectTimeSignature: (id: number) => {
      rulerStore.selectedTimeSignatureEventIds = [id]
    },
    clearSelectedTimeSignature: () => {
      rulerStore.selectedTimeSignatureEventIds = []
    },
    updateTimeSignature: (numerator: number, denominator: number) => {
      rulerStore.selectedTimeSignatureEventIds.forEach((id) => {
        updateTimeSignature(id, numerator, denominator)
      })
    },
  }
}
