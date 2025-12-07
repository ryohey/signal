import styled from "@emotion/styled"
import Pause from "mdi-react/PauseIcon"
import PlayArrow from "mdi-react/PlayArrowIcon"
import type { FC } from "react"
import { Localized } from "../../localize/useLocalization"
import { Tooltip } from "../ui/Tooltip"
import { CircleButton } from "./CircleButton"

export const StyledButton = styled(CircleButton)`
  color: var(--color-on-surface);
  background: var(--color-theme);

  &:hover {
    background: var(--color-theme);
    opacity: 0.8;
  }

  &.active {
    background: var(--color-theme);
  }
`

export interface PlayButtonProps {
  onMouseDown?: () => void
  isPlaying: boolean
}

export const PlayButton: FC<PlayButtonProps> = ({ onMouseDown, isPlaying }) => {
  return (
    <Tooltip
      title={
        <>
          <Localized name="play-pause" /> [space]
        </>
      }
      side="top"
    >
      <StyledButton
        id="button-play"
        onMouseDown={onMouseDown}
        className={isPlaying ? "active" : undefined}
      >
        {isPlaying ? <Pause /> : <PlayArrow />}
      </StyledButton>
    </Tooltip>
  )
}
