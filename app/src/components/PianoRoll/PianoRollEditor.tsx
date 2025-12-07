import styled from "@emotion/styled"
import type { SplitPaneProps } from "@ryohey/react-split-pane"
import type { FC, ReactNode } from "react"
import { useAutoFocus } from "../../hooks/useAutoFocus"
import { useEventList } from "../../hooks/useEventList"
import { PianoRollScope } from "../../hooks/usePianoRoll"
import { usePianoRollKeyboardShortcut } from "../../hooks/usePianoRollKeyboardShortcut"
import { useTrackList } from "../../hooks/useTrackList"
import EventList from "../EventEditor/EventList"
import { PianoRollToolbar } from "../PianoRollToolbar/PianoRollToolbar"
import { TrackList } from "../TrackList/TrackList"
import { PianoRollTransposeDialog } from "../TransposeDialog/PianoRollTransposeDialog"
import { PianoRollVelocityDialog } from "../VelocityDialog/PianoRollVelocityDialog"
import PianoRoll from "./PianoRoll"
import { StyledSplitPane } from "./StyledSplitPane"

const ColumnContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  outline: none;
`

const PaneLayout: FC<SplitPaneProps & { isShow: boolean; pane: ReactNode }> = ({
  isShow,
  pane,
  children,
  ...props
}) => {
  if (isShow) {
    return (
      <StyledSplitPane {...props}>
        {pane}
        {children}
      </StyledSplitPane>
    )
  }
  return <>{children}</>
}

const PianoRollPanes: FC = () => {
  const { isOpen: showTrackList } = useTrackList()
  const { isOpen: showEventList } = useEventList()

  return (
    <div style={{ display: "flex", flexGrow: 1, position: "relative" }}>
      <PaneLayout
        split="vertical"
        minSize={280}
        pane1Style={{ display: "flex" }}
        pane2Style={{ display: "flex" }}
        isShow={showTrackList}
        pane={<TrackList />}
      >
        <PaneLayout
          split="vertical"
          minSize={240}
          pane1Style={{ display: "flex" }}
          pane2Style={{ display: "flex" }}
          isShow={showEventList}
          pane={<EventList />}
        >
          <PianoRoll />
        </PaneLayout>
      </PaneLayout>
    </div>
  )
}

export const PianoRollEditor: FC = () => {
  const keyboardShortcutProps = usePianoRollKeyboardShortcut()
  const ref = useAutoFocus<HTMLDivElement>()

  return (
    <PianoRollScope>
      <ColumnContainer {...keyboardShortcutProps} tabIndex={0} ref={ref}>
        <PianoRollToolbar />
        <PianoRollPanes />
      </ColumnContainer>
      <PianoRollTransposeDialog />
      <PianoRollVelocityDialog />
    </PianoRollScope>
  )
}
