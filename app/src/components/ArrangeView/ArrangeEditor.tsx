import styled from "@emotion/styled"
import { FC } from "react"
import { useStores } from "../../hooks/useStores"
import { TickScrollProvider } from "../../hooks/useTickScroll"
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
  const {
    arrangeViewStore: { tickScrollStore },
  } = useStores()

  return (
    <TickScrollProvider value={tickScrollStore}>
      <Container>
        <ArrangeViewKeyboardShortcut />
        <ArrangeToolbar />
        <ArrangeView />
      </Container>
      <ArrangeTransposeDialog />
      <ArrangeVelocityDialog />
    </TickScrollProvider>
  )
}
