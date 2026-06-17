import styled from "@emotion/styled"
import { SplitPaneProps } from "@ryohey/react-split-pane"
import { FC, ReactNode } from "react"
import { useAutoFocus } from "../../../hooks/useAutoFocus"
import EventList from "../../event-list/components/EventList"
import { useEventList } from "../../event-list/hooks/useEventList"
import { TrackList } from "../../track-list/components/TrackList"
import { useTrackList } from "../../track-list/hooks/useTrackList"
import { PianoRollScope } from "../hooks/usePianoRoll"
import { usePianoRollGlobalKeyboardShortcuts } from "../hooks/usePianoRollGlobalKeyboardShortcuts"
import { usePianoRollKeyboardShortcut } from "../hooks/usePianoRollKeyboardShortcut"
import { PianoRollTransposeDialog } from "./dialogs/PianoRollTransposeDialog"
import { PianoRollVelocityDialog } from "./dialogs/PianoRollVelocityDialog"
import { PianoRollEditMenu } from "./menus/PianoRollEditMenu"
import PianoRoll from "./PianoRoll"
import { StyledSplitPane } from "./StyledSplitPane"
import { PianoRollToolbar } from "./toolbar/PianoRollToolbar"

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

  usePianoRollGlobalKeyboardShortcuts()

  return (
    <PianoRollScope>
      <PianoRollEditMenu />
      <ColumnContainer {...keyboardShortcutProps} tabIndex={0} ref={ref}>
        <PianoRollToolbar />
        <PianoRollPanes />
      </ColumnContainer>
      <PianoRollTransposeDialog />
      <PianoRollVelocityDialog />
    </PianoRollScope>
  )
}
