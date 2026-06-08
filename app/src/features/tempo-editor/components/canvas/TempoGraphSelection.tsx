import { FC, useMemo } from "react"
import { Selection } from "../../../../components/GLNodes/Selection"
import { TempoSelection } from "../../entities/TempoSelection"
import { useTempoEditor } from "../../hooks/useTempoEditor"
import { useTempoTransform } from "../../hooks/useTempoTransform"

export interface TempoGraphSelectionProps {
  zIndex: number
}

export const TempoGraphSelection: FC<TempoGraphSelectionProps> = ({
  zIndex,
}) => {
  const { selection } = useTempoEditor()
  const { transform } = useTempoTransform()

  const selectionRect = useMemo(
    () =>
      selection != null ? TempoSelection.getBounds(selection, transform) : null,
    [selection, transform],
  )

  return <Selection rect={selectionRect} zIndex={zIndex} />
}
