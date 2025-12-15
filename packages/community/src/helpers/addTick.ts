import { DistributiveOmit } from "@emotion/react"

export function addTick<T extends { deltaTime: number }>(events: T[]) {
  let tick = 0
  return events.map((e) => {
    const { deltaTime, ...rest } = e
    tick += deltaTime
    return {
      ...(rest as DistributiveOmit<T, "deltaTime">),
      tick,
    }
  })
}
