import { HitArea } from "@ryohey/webgl-react"
import { ControlCoordTransform } from "../../../entities/transform/ControlCoordTransform"
import { useControlPane } from "../../../hooks/useControlPane"
import { Selection } from "../../GLNodes/Selection"

export interface LineGraphSelectionProps {
  zIndex: number
  transform: ControlCoordTransform
}

export const LineGraphSelection = ({
  zIndex,
  transform,
}: LineGraphSelectionProps) => {
  const { selection } = useControlPane()

  const selectionRect =
    selection !== null ? transform.transformSelection(selection) : null

  return (
    <>
      <Selection rect={selectionRect} zIndex={zIndex} />
      {selectionRect && <HitArea bounds={selectionRect} zIndex={zIndex} />}
    </>
  )
}
