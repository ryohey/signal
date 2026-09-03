import { clamp } from "lodash"
import { ControlEvent } from "./ControlEvent"
import { ControlItem } from "./ControlItem"

export const controlEventToItem = (event: ControlEvent): ControlItem => ({
  id: event.id,
  tick: event.tick,
  value: event.value,
})

export const moveControlItem =
  (deltaTick: number, deltaValue: number, maxValue: number) =>
  (item: ControlItem): ControlItem => ({
    ...item,
    tick: Math.max(0, item.tick + deltaTick),
    value: clamp(item.value + deltaValue, 0, maxValue),
  })
