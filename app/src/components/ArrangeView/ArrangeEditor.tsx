import styled from "@emotion/styled"
import { FC } from "react"
import { ArrangeViewScope } from "../../hooks/useArrangeView"
import { useArrangeViewKeyboardShortcut } from "../../hooks/useArrangeViewKeyboardShortcut"
import { ArrangeToolbar } from "../ArrangeToolbar/ArrangeToolbar"
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
`

const Content: FC = () => {
  const keyboardShortcutProps = useArrangeViewKeyboardShortcut()

  return (
    <>
      <Container {...keyboardShortcutProps} tabIndex={0}>
        <ArrangeToolbar />
        <ArrangeView />
      </Container>
      <ArrangeTransposeDialog />
      <ArrangeVelocityDialog />
    </>
  )
}

export const ArrangeEditor: FC = () => {
  return (
    <ArrangeViewScope>
      <Content />
    </ArrangeViewScope>
  )
}
