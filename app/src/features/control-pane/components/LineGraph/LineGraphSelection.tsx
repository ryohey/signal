import { HitArea } from "@ryohey/webgl-react"
import { Selection } from "../../../../components/GLNodes/Selection"
import { ControlCoordTransform } from "../../entities/ControlCoordTransform"
import { useControlPane } from "../../hooks/useControlPane"

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
