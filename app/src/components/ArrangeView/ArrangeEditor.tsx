import styled from "@emotion/styled"
import { FC } from "react"
import { useAIChat } from "../../hooks/useAIChat"
import { ArrangeViewScope } from "../../hooks/useArrangeView"
import { useArrangeViewKeyboardShortcut } from "../../hooks/useArrangeViewKeyboardShortcut"
import { useAutoFocus } from "../../hooks/useAutoFocus"
import { AIChat } from "../AIChat/AIChat"
import { ArrangeToolbar } from "../ArrangeToolbar/ArrangeToolbar"
import { StyledSplitPane } from "../PianoRoll/StyledSplitPane"
import { ArrangeTransposeDialog } from "../TransposeDialog/ArrangeTransposeDialog"
import { ArrangeVelocityDialog } from "../VelocityDialog/ArrangeVelocityDialog"
import { ArrangeView } from "./ArrangeView"

const Container = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;
  outline: none;
  height: 100%;
  min-height: 0;
`

const MainContainer = styled.div`
  display: flex;
  flex-grow: 1;
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`

const Content: FC = () => {
  const keyboardShortcutProps = useArrangeViewKeyboardShortcut()
  const ref = useAutoFocus<HTMLDivElement>()

  return (
    <>
      <Container {...keyboardShortcutProps} tabIndex={0} ref={ref}>
        <ArrangeToolbar />
        <ArrangeView />
      </Container>
      <ArrangeTransposeDialog />
      <ArrangeVelocityDialog />
    </>
  )
}

export const ArrangeEditor: FC = () => {
  const { isOpen: isAIChatOpen } = useAIChat()

  return (
    <ArrangeViewScope>
      <MainContainer>
        {isAIChatOpen ? (
          <StyledSplitPane
            split="vertical"
            minSize={400}
            defaultSize="75%"
            primary="first"
            pane1Style={{ display: "flex" }}
            pane2Style={{ display: "flex" }}
          >
            <Content />
            <AIChat />
          </StyledSplitPane>
        ) : (
          <Content />
        )}
      </MainContainer>
    </ArrangeViewScope>
  )
}
