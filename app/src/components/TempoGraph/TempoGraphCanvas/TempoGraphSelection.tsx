import { type FC, useMemo } from "react"
import { TempoSelection } from "../../../entities/selection/TempoSelection"
import { useTempoEditor } from "../../../hooks/useTempoEditor"
import { Selection } from "../../GLNodes/Selection"

export interface TempoGraphSelectionProps {
  zIndex: number
}

export const TempoGraphSelection: FC<TempoGraphSelectionProps> = ({
  zIndex,
}) => {
  const { transform, selection } = useTempoEditor()

  const selectionRect = useMemo(
    () =>
      selection != null ? TempoSelection.getBounds(selection, transform) : null,
    [selection, transform]
  )

  return <Selection rect={selectionRect} zIndex={zIndex} />
}
