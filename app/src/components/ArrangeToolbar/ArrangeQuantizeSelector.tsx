import { FC } from "react"
import { useQuantizer } from "../../hooks/useQuantizer"
import QuantizeSelector from "../Toolbar/QuantizeSelector/QuantizeSelector"

export const ArrangeQuantizeSelector: FC = () => {
  const { quantize, setQuantize } = useQuantizer()

  return (
    <QuantizeSelector
      value={quantize}
      enabled={true}
      onSelect={setQuantize}
      onClickSwitch={() => {}}
    />
  )
}
