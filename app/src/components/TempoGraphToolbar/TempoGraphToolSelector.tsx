import { FC } from "react"
import { useTempoEditor } from "../../hooks/useTempoEditor"
import { ToolSelector } from "../Toolbar/ToolSelector"

export const TempoGraphToolSelector: FC = () => {
  const { mouseMode, setMouseMode } = useTempoEditor()
  return <ToolSelector mouseMode={mouseMode} onSelect={setMouseMode} />
}
