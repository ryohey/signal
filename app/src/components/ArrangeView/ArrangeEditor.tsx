import styled from "@emotion/styled"
import { FC } from "react"
import { ArrangeViewScope } from "../../hooks/useArrangeView"
import { ArrangeToolbar } from "../ArrangeToolbar/ArrangeToolbar"
import { ArrangeViewKeyboardShortcut } from "../KeyboardShortcut/ArrangeViewKeyboardShortcut"
import { ArrangeTransposeDialog } from "../TransposeDialog/ArrangeTransposeDialog"
import { ArrangeVelocityDialog } from "../VelocityDialog/ArrangeVelocityDialog"
import { ArrangeView } from "./ArrangeView"

const Container = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;
`

export const ArrangeEditor: FC = () => {
  return (
    <ArrangeViewScope>
      <Container>
        <ArrangeViewKeyboardShortcut />
        <ArrangeToolbar />
        <ArrangeView />
      </Container>
      <ArrangeTransposeDialog />
      <ArrangeVelocityDialog />
    </ArrangeViewScope>
  )
}
