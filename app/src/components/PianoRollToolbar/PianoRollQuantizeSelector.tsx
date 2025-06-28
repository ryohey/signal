import { FC, useCallback } from "react"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import QuantizeSelector from "../Toolbar/QuantizeSelector/QuantizeSelector"

export const PianoRollQuantizeSelector: FC = () => {
  const { quantize, isQuantizeEnabled, setQuantize, setIsQuantizeEnabled } =
    usePianoRoll()

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
