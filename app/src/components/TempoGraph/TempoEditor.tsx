import styled from "@emotion/styled"
import { FC } from "react"
import { useAutoFocus } from "../../hooks/useAutoFocus"
import { TempoEditorScope } from "../../hooks/useTempoEditor"
import { useTempoEditorKeyboardShortcut } from "../../hooks/useTempoEditorKeyboardShortcut"
import { TempoGraphToolbar } from "../TempoGraphToolbar/TempoGraphToolbar"
import { TempoGraph } from "./TempoGraph"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
  outline: none;
`

const Content: FC = () => {
  const keyboardShortcutProps = useTempoEditorKeyboardShortcut()
  const ref = useAutoFocus<HTMLDivElement>()

  return (
    <Container {...keyboardShortcutProps} tabIndex={0} ref={ref}>
      <TempoGraphToolbar />
      <TempoGraph />
    </Container>
  )
}

export const TempoEditor: FC = () => {
  return (
    <TempoEditorScope>
      <Content />
    </TempoEditorScope>
  )
}
