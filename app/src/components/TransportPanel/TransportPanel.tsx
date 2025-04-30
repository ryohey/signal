import styled from "@emotion/styled"
import FastForward from "mdi-react/FastForwardIcon"
import FastRewind from "mdi-react/FastRewindIcon"
import FiberManualRecord from "mdi-react/FiberManualRecordIcon"
import Loop from "mdi-react/LoopIcon"
import MetronomeIcon from "mdi-react/MetronomeIcon"
import Stop from "mdi-react/StopIcon"
import { observer } from "mobx-react-lite"
import { FC, useCallback } from "react"
import { useFastForwardOneBar, useRewindOneBar, useStop } from "../../actions"
import { useToggleRecording } from "../../actions/recording"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { usePlayer } from "../../hooks/usePlayer"
import { useStores } from "../../hooks/useStores"
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
  const { currentMBTTime } = usePianoRoll()
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

export const TransportPanel: FC = observer(() => {
  const {
    midiDeviceStore,
    midiRecorder,
    soundFontStore,
    synthGroup,
    synthGroup: { isMetronomeEnabled },
  } = useStores()

  const { isPlaying, loop, playOrPause, toggleEnableLoop } = usePlayer()
  const isRecording = midiRecorder.isRecording
  const canRecording =
    Object.values(midiDeviceStore.enabledInputs).filter((e) => e).length > 0
  const isSynthLoading = soundFontStore.isLoading
  const stop = useStop()
  const rewindOneBar = useRewindOneBar()
  const fastForwardOneBar = useFastForwardOneBar()
  const toggleRecording = useToggleRecording()

  const onClickPlay = playOrPause
  const onClickStop = stop
  const onClickBackward = rewindOneBar
  const onClickForward = fastForwardOneBar
  const onClickRecord = toggleRecording
  const onClickEnableLoop = toggleEnableLoop
  const onClickMetronone = useCallback(() => {
    synthGroup.isMetronomeEnabled = !synthGroup.isMetronomeEnabled
  }, [synthGroup])

  return (
    <Toolbar>
      <Tooltip title={<Localized name="rewind" />} side="top">
        <CircleButton onMouseDown={onClickBackward}>
          <FastRewind />
        </CircleButton>
      </Tooltip>

      <Tooltip title={<Localized name="stop" />} side="top">
        <CircleButton onMouseDown={onClickStop}>
          <Stop />
        </CircleButton>
      </Tooltip>

      <PlayButton onMouseDown={onClickPlay} isPlaying={isPlaying} />

      {canRecording && (
        <Tooltip title={<Localized name="record" />} side="top">
          <RecordButton onMouseDown={onClickRecord} data-active={isRecording}>
            <FiberManualRecord />
          </RecordButton>
        </Tooltip>
      )}

      <Tooltip title={<Localized name="fast-forward" />} side="top">
        <CircleButton onMouseDown={onClickForward}>
          <FastForward />
        </CircleButton>
      </Tooltip>

      {loop && (
        <LoopButton onMouseDown={onClickEnableLoop} data-active={loop.enabled}>
          <Loop />
        </LoopButton>
      )}

      <ToolbarSeparator />

      <MetronomeButton
        onMouseDown={onClickMetronone}
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
})
