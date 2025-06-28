import { FC, useCallback } from "react"
import { useTempoEditor } from "../../hooks/useTempoEditor"
import QuantizeSelector from "../Toolbar/QuantizeSelector/QuantizeSelector"

export const TempoGraphQuantizeSelector: FC = () => {
  const { quantize, setQuantize, isQuantizeEnabled, setQuantizeEnabled } =
    useTempoEditor()

  const onClickQuantizeSwitch = useCallback(() => {
    setQuantizeEnabled(!isQuantizeEnabled)
  }, [setQuantizeEnabled, isQuantizeEnabled])

  return (
    <QuantizeSelector
      value={quantize}
      enabled={isQuantizeEnabled}
      onSelect={setQuantize}
      onClickSwitch={onClickQuantizeSwitch}
    />
  )
}
