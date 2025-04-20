import { FC } from "react"
import { useArrangeView } from "../../hooks/useArrangeView"
import QuantizeSelector from "../Toolbar/QuantizeSelector/QuantizeSelector"

export const ArrangeQuantizeSelector: FC = () => {
  const { quantize, setQuantize } = useArrangeView()

  return (
    <QuantizeSelector
      value={quantize}
      enabled={true}
      onSelect={setQuantize}
      onClickSwitch={() => {}}
    />
  )
}
