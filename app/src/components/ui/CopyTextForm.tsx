import styled from "@emotion/styled"
import { useToast } from "dialog-hooks"
import { type FC, useCallback } from "react"
import { Localized, useLocalization } from "../../localize/useLocalization"
import { PrimaryButton } from "./Button"

const Form = styled.div`
  display: flex;
  flex-grow: 1;
`

const Input = styled.input`
  flex-grow: 1;
  border: none;
  border-radius: 0.2rem;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  outline: none;
  margin-right: 0.5rem;
`

const Action = styled.div``

export const CopyTextForm: FC<{ text: string }> = ({ text }) => {
  const toast = useToast()
  const localized = useLocalization()

  const onClick = useCallback(() => {
    navigator.clipboard.writeText(text)
    toast.success(localized["copied"])
  }, [text, toast, localized])

  return (
    <Form>
      <Input
        type="text"
        value={text}
        readOnly
        onFocus={(e) => {
          e.target.select()
        }}
      />
      <Action>
        <PrimaryButton onClick={onClick}>
          <Localized name="copy" />
        </PrimaryButton>
      </Action>
    </Form>
  )
}
