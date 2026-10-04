import { ToolSelector } from "../../../../components/Toolbar/ToolSelector"
import { usePianoRoll } from "../../hooks/usePianoRoll"

export const PianoRollToolSelector = () => {
  const { mouseMode, setMouseMode } = usePianoRoll()
  return <ToolSelector mouseMode={mouseMode} onSelect={setMouseMode} />
}
