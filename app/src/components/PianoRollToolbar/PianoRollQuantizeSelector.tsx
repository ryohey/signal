import { FC, useCallback } from "react"
import { useQuantizer } from "../../hooks/useQuantizer"
import QuantizeSelector from "../Toolbar/QuantizeSelector/QuantizeSelector"

export const PianoRollQuantizeSelector: FC = () => {
  const { quantize, isQuantizeEnabled, setQuantize, setIsQuantizeEnabled } =
    useQuantizer()

  const onSelectQuantize = useCallback(
    (denominator: number) => {
      setQuantize(denominator)
    },
    [setQuantize],
  )

  const onClickQuantizeSwitch = useCallback(() => {
    setIsQuantizeEnabled(!isQuantizeEnabled)
  }, [isQuantizeEnabled, setIsQuantizeEnabled])

  return (
    <QuantizeSelector
      value={quantize}
      enabled={isQuantizeEnabled}
      onSelect={onSelectQuantize}
      onClickSwitch={onClickQuantizeSwitch}
    />
  )
}
