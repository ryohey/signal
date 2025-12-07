import styled from "@emotion/styled"
import Add from "mdi-react/AddIcon"
import type { FC } from "react"
import { useAddTrack } from "../../actions"
import { Localized } from "../../localize/useLocalization"

const Wrapper = styled.div`
  display: flex;
  padding: 0.5rem 1rem;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  border-radius: 0.5rem;
  margin: 0.5rem;

  &:hover {
    background: var(--color-highlight);
  }
`

const AddIcon = styled(Add)`
  min-width: auto;
  margin-right: 0.5em;
  color: inherit;
`

const Label = styled.div`
  font-size: 0.875rem;
`

export const AddTrackButton: FC = () => {
  const addTrack = useAddTrack()

  return (
    <Wrapper onClick={addTrack}>
      <AddIcon />
      <Label>
        <Localized name="add-track" />
      </Label>
    </Wrapper>
  )
}
