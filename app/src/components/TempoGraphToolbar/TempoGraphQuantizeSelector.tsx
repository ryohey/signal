import { FC, useCallback } from "react"
import { useQuantizer } from "../../hooks/useQuantizer"
import QuantizeSelector from "../Toolbar/QuantizeSelector/QuantizeSelector"

export const TempoGraphQuantizeSelector: FC = () => {
  const { quantize, setQuantize, isQuantizeEnabled, setIsQuantizeEnabled } =
    useQuantizer()

  const onClickQuantizeSwitch = useCallback(() => {
    setIsQuantizeEnabled(!isQuantizeEnabled)
  }, [setIsQuantizeEnabled, isQuantizeEnabled])

  return (
    <QuantizeSelector
      value={quantize}
      enabled={isQuantizeEnabled}
      onSelect={setQuantize}
      onClickSwitch={onClickQuantizeSwitch}
    />
  )
}
