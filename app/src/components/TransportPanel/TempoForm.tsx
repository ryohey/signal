import styled from "@emotion/styled"
import { DEFAULT_TEMPO } from "@signal-app/player"
import { observer } from "mobx-react-lite"
import { FC } from "react"
import { usePlayer } from "../../hooks/usePlayer"
import { useSong } from "../../hooks/useSong"
import { useStores } from "../../hooks/useStores"
import { NumberInput } from "../inputs/NumberInput"

const TempoInput = styled(NumberInput)`
  background: transparent;
  -webkit-appearance: none;
  border: none;
  color: inherit;
  font-size: inherit;
  font-family: inherit;
  width: 5em;
  text-align: center;
  outline: none;
  font-family: ${({ theme }) => theme.monoFont};
  font-size: 1rem;
  padding: 0.3rem 0;

  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`

const TempoWrapper = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  padding-left: 0.75rem;
  border-radius: 0.25rem;

  label {
    font-size: 0.6rem;
    color: ${({ theme }) => theme.secondaryTextColor};
  }

  &:focus-within {
    border: 1px solid ${({ theme }) => theme.dividerColor};
    background: #ffffff14;
  }
`

export const TempoForm: FC = observer(() => {
  const {
    pianoRollStore: { currentTempo },
  } = useStores()
  const { position, setCurrentTempo } = usePlayer()
  const song = useSong()
  const tempo = currentTempo ?? DEFAULT_TEMPO

  const changeTempo = (tempo: number) => {
    song.conductorTrack?.setTempo(tempo, position)
    setCurrentTempo(tempo)
  }

  return (
    <TempoWrapper>
      <label htmlFor="tempo-input">BPM</label>
      <TempoInput
        id="tempo-input"
        min={1}
        max={512}
        value={Math.round(tempo * 100) / 100}
        step={1}
        onChange={changeTempo}
      />
    </TempoWrapper>
  )
})
