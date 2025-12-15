import styled from "@emotion/styled"
import Close from "mdi-react/CloseIcon"
import Pause from "mdi-react/PauseIcon"
import Play from "mdi-react/PlayIcon"
import Download from "mdi-react/DownloadIcon"
import { FC, useCallback, useRef, useState, useEffect } from "react"
import { useHQRender } from "../../hooks/useHQRender"

const Container = styled.div`
  position: fixed;
  bottom: 5rem;
  right: 1.5rem;
  background: var(--color-background-dark);
  border: 1px solid var(--color-divider);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  min-width: 280px;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Title = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const Badge = styled.span`
  background: var(--color-theme);
  color: var(--color-on-surface);
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
`

const CloseButton = styled.button`
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text);
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const PlayButton = styled.button<{ isPlaying: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--color-theme);
  color: var(--color-on-surface);
  cursor: pointer;
  transition: all 150ms ease;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 12px var(--color-theme);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: currentColor;
  }
`

const ProgressContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const ProgressBar = styled.div`
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
`

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${({ progress }) => progress * 100}%;
  background: var(--color-theme);
  border-radius: 2px;
  transition: width 100ms linear;
`

const TimeDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
`

const ActionButton = styled.button`
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text);
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export const HQAudioPlayer: FC = () => {
  const { audioUrl, isPlayerOpen, closePlayer } = useHQRender()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Create audio element when URL changes
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration)
      })

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime)
        setProgress(audio.duration > 0 ? audio.currentTime / audio.duration : 0)
      })

      audio.addEventListener("ended", () => {
        setIsPlaying(false)
        setProgress(0)
        setCurrentTime(0)
      })

      return () => {
        audio.pause()
        audio.src = ""
      }
    }
  }, [audioUrl])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current
      if (!audio || !duration) return

      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newProgress = clickX / rect.width
      audio.currentTime = newProgress * duration
    },
    [duration],
  )

  const handleDownload = useCallback(() => {
    if (audioUrl) {
      const a = document.createElement("a")
      a.href = audioUrl
      a.download = "rendered-audio.wav"
      a.click()
    }
  }, [audioUrl])

  const handleClose = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
    }
    setIsPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    closePlayer()
  }, [closePlayer])

  if (!isPlayerOpen || !audioUrl) {
    return null
  }

  return (
    <Container>
      <Header>
        <Title>
          Rendered Audio
          <Badge>HQ</Badge>
        </Title>
        <CloseButton onClick={handleClose}>
          <Close />
        </CloseButton>
      </Header>

      <Controls>
        <PlayButton isPlaying={isPlaying} onClick={togglePlay}>
          {isPlaying ? <Pause /> : <Play />}
        </PlayButton>

        <ProgressContainer>
          <ProgressBar onClick={handleProgressClick}>
            <ProgressFill progress={progress} />
          </ProgressBar>
          <TimeDisplay>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </TimeDisplay>
        </ProgressContainer>

        <ActionButton onClick={handleDownload} title="Download WAV">
          <Download />
        </ActionButton>
      </Controls>
    </Container>
  )
}
