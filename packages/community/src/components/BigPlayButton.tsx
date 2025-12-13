import styled from "@emotion/styled"
import Pause from "mdi-react/PauseIcon.js"
import PlayArrow from "mdi-react/PlayArrowIcon.js"
import type { FC } from "react"
import { CircleButton } from "./CircleButton.js"

export const StyledButton = styled(CircleButton)`
  background: var(--color-theme);

  &:hover {
    background: var(--color-theme);
    opacity: 0.8;
  }

  &.active {
    background: var(--color-theme);
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`

export interface BigPlayButtonProps {
  onMouseDown?: () => void
  isPlaying: boolean
}

export const BigPlayButton: FC<BigPlayButtonProps> = ({
  onMouseDown,
  isPlaying,
}) => {
  return (
    <StyledButton
      onMouseDown={onMouseDown}
      className={isPlaying ? "active" : undefined}
    >
      {isPlaying ? <Pause /> : <PlayArrow />}
    </StyledButton>
  )
}
