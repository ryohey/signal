import { usePianoRoll } from "../../hooks/usePianoRoll"
import { ToolSelector } from "../Toolbar/ToolSelector"

export const PianoRollToolSelector = () => {
  const { mouseMode, setMouseMode } = usePianoRoll()
  return <ToolSelector mouseMode={mouseMode} onSelect={setMouseMode} />
}
