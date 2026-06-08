import { FC } from "react"
import { ToolSelector } from "../../../../components/Toolbar/ToolSelector"
import { useTempoEditor } from "../../hooks/useTempoEditor"

export const TempoGraphToolSelector: FC = () => {
  const { mouseMode, setMouseMode } = useTempoEditor()
  return <ToolSelector mouseMode={mouseMode} onSelect={setMouseMode} />
}
