import { FC } from "react"
import { useTempoEditor } from "../../../hooks/useTempoEditor"
import { LineGraphItems } from "../../ControlPane/LineGraph/LineGraphItems"

export interface TempoItemsProps {
  width: number
  zIndex: number
}

export const TempoItems: FC<TempoItemsProps> = ({ width, zIndex }) => {
  const { items, selectedEventIds, controlPoints, scrollLeft } =
    useTempoEditor()

  return (
    <LineGraphItems
      width={width}
      items={items.map((i) => ({ ...i.bounds, id: i.id }))}
      selectedEventIds={selectedEventIds}
      controlPoints={controlPoints}
      scrollLeft={scrollLeft}
      lineWidth={2}
      zIndex={zIndex}
    />
  )
}
