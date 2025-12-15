import styled from "@emotion/styled"
import { trackColorToCSSColor, TrackId } from "@signal-app/core"
import Headset from "mdi-react/HeadphonesIcon"
import Layers from "mdi-react/LayersIcon"
import VolumeUp from "mdi-react/VolumeHighIcon"
import VolumeOff from "mdi-react/VolumeOffIcon"
import { FC, MouseEventHandler, useCallback, useState } from "react"
import {
  useSelectTrack,
  useToggleAllGhostTracks,
  useToggleGhostTrack,
} from "../../actions"
import { useContextMenu } from "../../hooks/useContextMenu"
import { useInstrumentBrowser } from "../../hooks/useInstrumentBrowser"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { useRouter } from "../../hooks/useRouter"
import { useTrack } from "../../hooks/useTrack"
import { useTrackMute } from "../../hooks/useTrackMute"
import { categoryEmojis, getCategoryIndex } from "../../midi/GM"
import { Tooltip } from "../ui/Tooltip"
import { InstrumentName } from "./InstrumentName"
import { TrackDialog } from "./TrackDialog"
import { TrackListContextMenu } from "./TrackListContextMenu"
import { TrackName } from "./TrackName"

export type TrackListItemProps = {
  trackId: TrackId
}

const Container = styled.div`
  background-color: transparent;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  padding: 0.625rem 0.75rem;
  border-radius: 0.75rem;
  margin: 0.375rem 0.5rem;
  outline: none;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    transform: translateX(2px);
  }

  &[data-selected="true"] {
    background: rgba(0, 212, 170, 0.08);
    border-color: rgba(0, 212, 170, 0.2);
  }
`

const Label = styled.div`
  display: flex;
  padding-bottom: 0.25em;
  align-items: baseline;
  gap: 0.5rem;
`

const Instrument = styled.div`
  color: var(--color-text-tertiary);
  font-size: 0.6875rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 400;
`

const Name = styled.div`
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
  transition: color 150ms;

  &[data-selected="true"] {
    color: var(--color-text);
  }
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.125rem;
`

const ChannelName = styled.div`
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  font-size: 0.625rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  border: 1px solid var(--color-divider);
  padding: 0 0.375rem;
  cursor: pointer;
  height: 1.375rem;
  margin-left: 0.25rem;
  border-radius: 0.25rem;
  transition: all 150ms;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
    color: var(--color-text-secondary);
  }
`

const Icon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.625rem;
  margin-right: 0.625rem;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: scale(1.05);
  }

  &[data-selected="true"] {
    background: rgba(255, 255, 255, 0.08);
  }
`

const IconInner = styled.div`
  opacity: 0.6;
  transition: opacity 150ms;

  &[data-selected="true"] {
    opacity: 1;
  }
`

const ControlButton = styled.div`
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  color: var(--color-text-tertiary);
  cursor: pointer;
  outline: none;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-text-secondary);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 1rem;
    height: 1rem;
  }

  &[data-active="true"] {
    color: var(--color-theme);
  }
`

export const TrackListItem: FC<TrackListItemProps> = ({ trackId }) => {
  const { selectedTrackId, notGhostTrackIds } = usePianoRoll()
  const {
    channel,
    isConductorTrack,
    programNumber,
    isRhythmTrack,
    color: trackColor,
    isMuted,
    isSolo,
  } = useTrack(trackId)
  const { setPath } = useRouter()
  const { setSetting, setOpen } = useInstrumentBrowser()
  const { toggleMute: toggleMuteTrack, toggleSolo: toggleSoloTrack } =
    useTrackMute()
  const toggleGhostTrack = useToggleGhostTrack()
  const toggleAllGhostTracks = useToggleAllGhostTracks()
  const selectTrack = useSelectTrack()

  const selected = trackId === selectedTrackId
  const ghostTrack = !notGhostTrackIds.has(trackId)
  const { onContextMenu, menuProps } = useContextMenu()
  const [isDialogOpened, setDialogOpened] = useState(false)

  const onDoubleClickIcon = useCallback(() => {
    if (isConductorTrack) {
      return
    }
    setOpen(true)
    setSetting({
      programNumber,
      isRhythmTrack,
    })
  }, [setSetting, programNumber, isRhythmTrack, setOpen, isConductorTrack])

  const onClickMute: MouseEventHandler = useCallback(
    (e) => {
      e.stopPropagation()
      toggleMuteTrack(trackId)
    },
    [trackId, toggleMuteTrack],
  )

  const onClickSolo: MouseEventHandler = useCallback(
    (e) => {
      e.stopPropagation()
      toggleSoloTrack(trackId)
    },
    [trackId, toggleSoloTrack],
  )

  const onClickGhostTrack: MouseEventHandler = useCallback(
    (e) => {
      e.stopPropagation()
      if (e.nativeEvent.altKey) {
        toggleAllGhostTracks()
      } else {
        toggleGhostTrack(trackId)
      }
    },
    [trackId, toggleAllGhostTracks, toggleGhostTrack],
  )

  const onSelectTrack = useCallback(() => {
    setPath("/track")
    selectTrack(trackId)
  }, [trackId, selectTrack, setPath])

  const onClickChannel = useCallback(() => {
    setDialogOpened(true)
  }, [])

  const emoji = isRhythmTrack
    ? "🥁"
    : categoryEmojis[getCategoryIndex(programNumber ?? 0)]

  const color =
    trackColor !== undefined ? trackColorToCSSColor(trackColor) : "transparent"

  return (
    <>
      <Container
        data-selected={selected}
        onMouseDown={onSelectTrack}
        onContextMenu={onContextMenu}
        tabIndex={-1}
      >
        <Tooltip title="Double-click to change instrument">
        <Icon
          data-selected={selected}
          style={{
            borderColor: color,
          }}
          onDoubleClick={onDoubleClickIcon}
        >
          <IconInner data-selected={selected}>{emoji}</IconInner>
        </Icon>
        </Tooltip>
        <div>
          <Label>
            <Name data-selected={selected}>
              <TrackName trackId={trackId} />
            </Name>
            <Instrument>
              <InstrumentName
                programNumber={programNumber}
                isRhythmTrack={isRhythmTrack}
              />
            </Instrument>
          </Label>
          <Controls>
            <Tooltip title={isSolo ? "Disable solo" : "Solo this track"}>
            <ControlButton
              data-active={isSolo}
              onMouseDown={onClickSolo}
              tabIndex={-1}
            >
              <Headset />
            </ControlButton>
            </Tooltip>
            <Tooltip title={isMuted ? "Unmute track" : "Mute track"}>
            <ControlButton
              data-active={isMuted}
              onMouseDown={onClickMute}
              tabIndex={-1}
            >
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </ControlButton>
            </Tooltip>
            <Tooltip title="Show notes from other tracks">
            <ControlButton
              data-active={ghostTrack}
              onMouseDown={onClickGhostTrack}
              tabIndex={-1}
            >
              <Layers />
            </ControlButton>
            </Tooltip>
            {channel !== undefined && (
              <Tooltip title="Change MIDI channel">
              <ChannelName onClick={onClickChannel}>
                CH {channel + 1}
              </ChannelName>
              </Tooltip>
            )}
          </Controls>
        </div>
      </Container>
      <TrackListContextMenu {...menuProps} trackId={trackId} />
      <TrackDialog
        trackId={trackId}
        open={isDialogOpened}
        onClose={() => setDialogOpened(false)}
      />
    </>
  )
}
