import styled from "@emotion/styled"
import { FC, useState } from "react"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { useTrack } from "../../hooks/useTrack"
import { TrackName } from "../TrackList/TrackName"

const TrackNameWrapper = styled.span`
  font-weight: bold;
  margin-right: 2em;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 14rem;
  min-width: 3em;
`

const Input = styled.input`
  font-size: inherit;
  font-family: inherit;
  border: var(--color-divider) 1px solid;
  color: inherit;
  height: 2rem;
  padding: 0 0.5rem;
  box-sizing: border-box;
  border-radius: 4px;
  margin-right: 1em;
  background: #00000017;
  outline: none;
`

export const TrackNameInput: FC = () => {
  const { selectedTrackId } = usePianoRoll()
  const { name, setName } = useTrack(selectedTrackId)
  const [isEditing, setEditing] = useState(false)

  return (
    <>
      {isEditing ? (
        <Input
          defaultValue={name}
          ref={(c) => c?.focus()}
          // to support IME we use onKeyPress instead of onKeyDown for capture Enter
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              setName(e.currentTarget.value)
              setEditing(false)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditing(false)
            }
          }}
          onBlur={() => setEditing(false)}
        />
      ) : (
        <TrackNameWrapper onDoubleClick={() => setEditing(true)}>
          <TrackName trackId={selectedTrackId} />
        </TrackNameWrapper>
      )}
    </>
  )
}
