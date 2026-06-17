import { HitArea } from "@ryohey/webgl-react"
import { Selection } from "../../../../components/GLNodes/Selection"
import { usePianoRoll } from "../../../piano-roll/hooks/usePianoRoll"
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
  const { activePane } = usePianoRoll()

  const selectionRect =
    selection !== null ? transform.transformSelection(selection) : null

  return (
    <>
      <Selection
        rect={selectionRect}
        zIndex={zIndex}
        isActive={activePane === "control"}
      />
      {selectionRect && <HitArea bounds={selectionRect} zIndex={zIndex} />}
    </>
  )
}
