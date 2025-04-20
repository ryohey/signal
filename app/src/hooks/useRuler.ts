import { findLast } from "lodash"
import { useCallback } from "react"
import { RulerStore } from "../stores/RulerStore"
import { useMobxSelector, useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

const TIME_SIGNATURE_HIT_WIDTH = 20

export function useRuler(rulerStore: RulerStore) {
  const { player } = useStores()
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

  return {
    canvasWidth,
    scrollLeft,
    beats,
    loop,
    timeSignatures,
    quantizer,
    transform,
    timeSignatureHitTest,
    setLoopBegin: (tick: number) => player.setLoopBegin(tick),
    setLoopEnd: (tick: number) => player.setLoopEnd(tick),
    seek: (tick: number) => {
      player.position = tick
    },
  }
}
