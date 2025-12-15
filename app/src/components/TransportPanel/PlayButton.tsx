import styled from "@emotion/styled"
import Pause from "mdi-react/PauseIcon"
import PlayArrow from "mdi-react/PlayArrowIcon"
import { FC } from "react"
import { Localized } from "../../localize/useLocalization"
import { Tooltip } from "../ui/Tooltip"
import { CircleButton } from "./CircleButton"

export const StyledButton = styled(CircleButton)`
  color: var(--color-on-surface);
  background: var(--color-theme);
  padding: 0.625rem;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0, 212, 170, 0.3);

  &:hover {
    background: var(--color-theme);
    filter: brightness(1.15);
    box-shadow: 0 0 24px rgba(0, 212, 170, 0.5);
    transform: scale(1.08);
  }

  &:active {
    transform: scale(0.95);
  }

  &.active {
    background: var(--color-theme);
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(0, 212, 170, 0.4);
    }
    50% {
      box-shadow: 0 0 30px rgba(0, 212, 170, 0.6);
    }
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`

export interface PlayButtonProps {
  onMouseDown?: () => void
  isPlaying: boolean
}

export const PlayButton: FC<PlayButtonProps> = ({ onMouseDown, isPlaying }) => {
  return (
    <Tooltip title="Play or pause playback [space]" side="top">
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
