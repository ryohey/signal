import styled from "@emotion/styled"
import { FC } from "react"
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

export const TempoEditor: FC = () => {
  const keyboardShortcutProps = useTempoEditorKeyboardShortcut()

  return (
    <TempoEditorScope>
      <Container {...keyboardShortcutProps} tabIndex={0}>
        <TempoGraphToolbar />
        <TempoGraph />
      </Container>
    </TempoEditorScope>
  )
}
