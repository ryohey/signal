import type { ValueEventType } from "@signal-app/control-editor"
import type { FC } from "react"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { ControlEditorProvider } from "../context/ControlEditorProvider"
import { VelocityEditorProvider } from "../context/VelocityEditorProvider"
import { useControlPane } from "../hooks/useControlPane"
import { useControlPaneGlobalKeyboardShortcut } from "../hooks/useControlPaneGlobalKeyboardShortcut"
import { useControlPaneKeyboardShortcut } from "../hooks/useControlPaneKeyboardShortcut"
import { ControlLayout } from "./ControlLayout"
import { ValueEventGraph } from "./Graph/ValueEventGraph"
import { PencilModeSelector } from "./PencilModeSelector"
import PianoVelocityControl from "./VelocityControl/VelocityControl"

export interface ControlPaneProps {
  axisWidth: number
}

const VelocityGraph: FC<ControlPaneProps> = ({ axisWidth }) => {
  return (
    <VelocityEditorProvider>
      <ControlLayout
        axisWidth={axisWidth}
        content={(props) => <PianoVelocityControl {...props} />}
      />
    </VelocityEditorProvider>
  )
}

const ControllerGraph: FC<ControlPaneProps & { type: ValueEventType }> = ({
  axisWidth,
  type,
}) => {
  const { mouseMode } = usePianoRoll()
  const { controlMode: mode } = useControlPane()
  const keyboardShortcutProps = useControlPaneKeyboardShortcut()
  useControlPaneGlobalKeyboardShortcut()

  const showPencilModeSelector =
    mouseMode === "pencil" && mode.type !== "velocity"

  return (
    <ControlLayout
      {...keyboardShortcutProps}
      axisWidth={axisWidth}
      content={(props) => <ValueEventGraph {...props} type={type} />}
      toolbarTrailing={showPencilModeSelector && <PencilModeSelector />}
    />
  )
}

const ControlPaneWrapper: FC<ControlPaneProps> = (props) => {
  const { controlMode: mode } = useControlPane()

  switch (mode.type) {
    case "velocity":
      return <VelocityGraph {...props} />
    default:
      return (
        <ControlEditorProvider type={mode}>
          <ControllerGraph {...props} type={mode} />
        </ControlEditorProvider>
      )
  }
}

export default ControlPaneWrapper
