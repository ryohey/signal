import styled from "@emotion/styled"
import { SplitPaneProps } from "@ryohey/react-split-pane"
import { FC, ReactNode } from "react"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import EventList from "../EventEditor/EventList"
import { PianoRollKeyboardShortcut } from "../KeyboardShortcut/PianoRollKeyboardShortcut"
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

export const PianoRollEditor: FC = () => {
  const { showTrackList, showEventList } = usePianoRoll()

  return (
    <>
      <ColumnContainer>
        <PianoRollKeyboardShortcut />
        <PianoRollToolbar />
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
      </ColumnContainer>
      <PianoRollTransposeDialog />
      <PianoRollVelocityDialog />
    </>
  )
}
