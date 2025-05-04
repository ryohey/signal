import styled from "@emotion/styled"
import { FC } from "react"
import { useStores } from "../../hooks/useStores"
import { TickScrollProvider } from "../../hooks/useTickScroll"
import { TempoEditorKeyboardShortcut } from "../KeyboardShortcut/TempoEditorKeyboardShortcut"
import { TempoGraphToolbar } from "../TempoGraphToolbar/TempoGraphToolbar"
import { TempoGraph } from "./TempoGraph"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
`

export const TempoEditor: FC = () => {
  const {
    tempoEditorStore: { tickScrollStore },
  } = useStores()

  return (
    <TickScrollProvider value={tickScrollStore}>
      <Container>
        <TempoEditorKeyboardShortcut />
        <TempoGraphToolbar />
        <TempoGraph />
      </Container>
    </TickScrollProvider>
  )
}
