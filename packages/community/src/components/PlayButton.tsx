import styled from "@emotion/styled"
import Pause from "mdi-react/PauseIcon.js"
import PlayArrow from "mdi-react/PlayArrowIcon.js"
import { FC } from "react"
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
`

export interface PlayButtonProps {
  onMouseDown?: () => void
  isPlaying: boolean
}

export const PlayButton: FC<PlayButtonProps> = ({
  onMouseDown,
  isPlaying,
}) => {
  return (
    <StyledButton
      id="button-play"
      onMouseDown={onMouseDown}
      className={isPlaying ? "active" : undefined}
    >
      {isPlaying ? <Pause /> : <PlayArrow />}
    </StyledButton>
  )
}
