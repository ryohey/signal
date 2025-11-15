import styled from "@emotion/styled"
import FastForward from "mdi-react/FastForwardIcon"
import FastRewind from "mdi-react/FastRewindIcon"
import FiberManualRecord from "mdi-react/FiberManualRecordIcon"
import Loop from "mdi-react/LoopIcon"
import MetronomeIcon from "mdi-react/MetronomeIcon"
import Stop from "mdi-react/StopIcon"
import { FC } from "react"
import { useSoundFont } from "../../hooks/useSoundFont"
import { useTransportPanel } from "../../hooks/useTransportPanel"
import { Localized } from "../../localize/useLocalization"
import { CircularProgress } from "../ui/CircularProgress"
import { Tooltip } from "../ui/Tooltip"
import { CircleButton } from "./CircleButton"
import { PlayButton } from "./PlayButton"
import { TempoForm } from "./TempoForm"

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 1rem;
  background: var(--color-background);
  border-top: 1px solid var(--color-divider);
  height: 3rem;
  box-sizing: border-box;
`

const RecordButton = styled(CircleButton)`
  &[data-active="true"] {
    color: var(--color-record);
  }
`

const LoopButton = styled(CircleButton)`
  &[data-active="true"] {
    color: var(--color-theme);
  }
`

const MetronomeButton = styled(CircleButton)`
  color: var(--color-text-secondary);

  &[data-active="true"] {
    color: var(--color-theme);
  }
`

const TimestampText = styled.div`
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--color-text-secondary);
`

const Timestamp: FC = () => {
  const { currentMBTTime } = useTransportPanel()
  return <TimestampText>{currentMBTTime}</TimestampText>
}

export const ToolbarSeparator = styled.div`
  background: var(--color-divider);
  margin: 0.4em 1em;
  width: 1px;
  height: 1rem;
`

export const Right = styled.div`
  position: absolute;
  right: 1em;
`

export const TransportPanel: FC = () => {
  const {
    rewindOneBar,
    fastForwardOneBar,
    stop,
    play,
    isPlaying,
    isRecording,
    toggleRecording,
    toggleEnableLoop,
    toggleMetronome,
    isLoopEnabled,
    isLoopActive,
    isMetronomeEnabled,
    canRecording,
  } = useTransportPanel()
  const { isLoading: isSynthLoading } = useSoundFont()

  return (
    <Toolbar>
      <Tooltip title={<Localized name="rewind" />} side="top">
        <CircleButton onMouseDown={rewindOneBar}>
          <FastRewind />
        </CircleButton>
      </Tooltip>

      <Tooltip title={<Localized name="stop" />} side="top">
        <CircleButton onMouseDown={stop}>
          <Stop />
        </CircleButton>
      </Tooltip>

      <PlayButton onMouseDown={play} isPlaying={isPlaying} />

      {canRecording && (
        <Tooltip title={<Localized name="record" />} side="top">
          <RecordButton onMouseDown={toggleRecording} data-active={isRecording}>
            <FiberManualRecord />
          </RecordButton>
        </Tooltip>
      )}

      <Tooltip title={<Localized name="fast-forward" />} side="top">
        <CircleButton onMouseDown={fastForwardOneBar}>
          <FastForward />
        </CircleButton>
      </Tooltip>

      {isLoopEnabled && (
        <LoopButton onMouseDown={toggleEnableLoop} data-active={isLoopActive}>
          <Loop />
        </LoopButton>
      )}

      <ToolbarSeparator />

      <MetronomeButton
        onMouseDown={toggleMetronome}
        data-active={isMetronomeEnabled}
      >
        <MetronomeIcon />
      </MetronomeButton>

      <TempoForm />

      <ToolbarSeparator />

      <Timestamp />

      {isSynthLoading && (
        <Right>
          <CircularProgress size="1rem" />
        </Right>
      )}
    </Toolbar>
  )
}
