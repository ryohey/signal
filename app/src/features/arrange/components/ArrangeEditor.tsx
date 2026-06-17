import styled from "@emotion/styled"
import { FC } from "react"
import { useAutoFocus } from "../../../hooks/useAutoFocus"
import { ArrangeViewScope } from "../hooks/useArrangeView"
import { useArrangeViewGlobalKeyboardShortcut } from "../hooks/useArrangeViewGlobalKeyboardShortcut"
import { useArrangeViewKeyboardShortcut } from "../hooks/useArrangeViewKeyboardShortcut"
import { ArrangeToolbar } from "./ArrangeToolbar"
import { ArrangeTransposeDialog } from "./ArrangeTransposeDialog"
import { ArrangeVelocityDialog } from "./ArrangeVelocityDialog"
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
  const ref = useAutoFocus<HTMLDivElement>()

  useArrangeViewGlobalKeyboardShortcut()

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
  return (
    <ArrangeViewScope>
      <Content />
    </ArrangeViewScope>
  )
}
