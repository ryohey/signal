import styled from "@emotion/styled"
import { FC } from "react"
import { ArrangeViewScope } from "../../hooks/useArrangeView"
import { useArrangeViewKeyboardShortcut } from "../../hooks/useArrangeViewKeyboardShortcut"
import { useAutoFocus } from "../../hooks/useAutoFocus"
import { useAIChat } from "../../hooks/useAIChat"
import { ArrangeToolbar } from "../ArrangeToolbar/ArrangeToolbar"
import { ArrangeTransposeDialog } from "../TransposeDialog/ArrangeTransposeDialog"
import { ArrangeVelocityDialog } from "../VelocityDialog/ArrangeVelocityDialog"
import { AIChat } from "../AIChat/AIChat"
import { ArrangeView } from "./ArrangeView"
import { StyledSplitPane } from "../PianoRoll/StyledSplitPane"

const Container = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;
  outline: none;
`

const MainContainer = styled.div`
  display: flex;
  flex-grow: 1;
  position: relative;
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
