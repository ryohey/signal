import styled from "@emotion/styled"
import { FC } from "react"
import { useAutoFocus } from "../../../hooks/useAutoFocus"
import { TempoEditorScope } from "../hooks/useTempoEditor"
import { useTempoEditorGlobalKeyboardShortcut } from "../hooks/useTempoEditorGlobalKeyboardShortcut"
import { useTempoEditorKeyboardShortcut } from "../hooks/useTempoEditorKeyboardShortcut"
import { TempoGraph } from "./TempoGraph"
import { TempoGraphToolbar } from "./toolbar/TempoGraphToolbar"

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

  useTempoEditorGlobalKeyboardShortcut()

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
