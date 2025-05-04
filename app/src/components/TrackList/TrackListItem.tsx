import styled from "@emotion/styled"
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
import { TrackId } from "../../track/Track"
import { trackColorToCSSColor } from "../../track/TrackColor"
import { TrackMute } from "../../trackMute/TrackMute"
import { TrackInstrumentName } from "./InstrumentName"
import { TrackDialog } from "./TrackDialog"
import { TrackListContextMenu } from "./TrackListContextMenu"
import { TrackName } from "./TrackName"

export type TrackListItemProps = {
  trackId: TrackId
}

const Container = styled.div`
  background-color: transparent;
  border: 1px solid;
  border-color: transparent;
  display: flex;
  align-items: center;
  padding: 0.5rem 0.5rem;
  border-radius: 0.5rem;
  margin: 0.5rem;
  outline: none;

  &:hover {
    background: var(--color-highlight);
  }

  &[data-selected="true"] {
    background-color: var(--color-highlight);
    border-color: var(--color-divider);
  }
`

const Label = styled.div`
  display: flex;
  padding-bottom: 0.3em;
  align-items: baseline;
`

const Instrument = styled.div`
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const Name = styled.div`
  font-weight: 600;
  color: var(--color-text-secondary);
  padding-right: 0.5em;
  font-size: 0.875rem;
  text-overflow: ellipsis;
  white-space: nowrap;

  &[data-selected="true"] {
    color: var(--color-text);
  }
`

const Controls = styled.div`
  display: flex;
  align-items: center;
`

const ChannelName = styled.div`
  flex-shrink: 0;
  color: var(--color-text-secondary);
  font-size: 0.625rem;
  display: flex;
  align-items: center;
  border: 1px solid var(--color-divider);
  padding: 0 0.25rem;
  cursor: pointer;
  height: 1.25rem;
  margin-left: 0.25rem;

  &:hover {
    background: var(--color-highlight);
  }
`

const Icon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 1.3rem;
  margin-right: 0.5rem;
  flex-shrink: 0;
  background: var(--color-background-secondary);
  border: 2px solid;
  box-sizing: border-box;

  &[data-selected="true"] {
    background: var(--color-background);
  }
`

const IconInner = styled.div`
  opacity: 0.5;

  &[data-selected="true"] {
    opacity: 1;
  }
`

const ControlButton = styled.div`
  width: 1.9rem;
  height: 1.9rem;
  margin-right: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: var(--color-text-secondary);
  cursor: pointer;
  outline: none;

  &:hover {
    background: var(--color-highlight);
  }

  svg {
    width: 1.1rem;
    height: 1.1rem;
  }

  &[data-active="true"] {
    color: var(--color-text);
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
  } = useTrack(trackId)
  const { trackMute } = useTrackMute()
  const { setPath } = useRouter()
  const { setSetting, setOpen } = useInstrumentBrowser()
  const { toggleMute: toggleMuteTrack, toggleSolo: toggleSoloTrack } =
    useTrackMute()
  const toggleGhostTrack = useToggleGhostTrack()
  const toggleAllGhostTracks = useToggleAllGhostTracks()
  const selectTrack = useSelectTrack()

  const selected = trackId === selectedTrackId
  const mute = TrackMute.isMuted(trackMute, trackId)
  const solo = TrackMute.isSolo(trackMute, trackId)
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
        <Icon
          data-selected={selected}
          style={{
            borderColor: color,
          }}
          onDoubleClick={onDoubleClickIcon}
        >
          <IconInner data-selected={selected}>{emoji}</IconInner>
        </Icon>
        <div>
          <Label>
            <Name data-selected={selected}>
              <TrackName trackId={trackId} />
            </Name>
            <Instrument>
              <TrackInstrumentName trackId={trackId} />
            </Instrument>
          </Label>
          <Controls>
            <ControlButton
              data-active={solo}
              onMouseDown={onClickSolo}
              tabIndex={-1}
            >
              <Headset />
            </ControlButton>
            <ControlButton
              data-active={mute}
              onMouseDown={onClickMute}
              tabIndex={-1}
            >
              {mute ? <VolumeOff /> : <VolumeUp />}
            </ControlButton>
            <ControlButton
              data-active={ghostTrack}
              onMouseDown={onClickGhostTrack}
              tabIndex={-1}
            >
              <Layers />
            </ControlButton>
            {channel !== undefined && (
              <ChannelName onClick={onClickChannel}>
                CH {channel + 1}
              </ChannelName>
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
