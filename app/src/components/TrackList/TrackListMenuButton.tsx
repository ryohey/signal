import styled from "@emotion/styled"
import ArrowLeft from "mdi-react/MenuLeftIcon"
import { FC, useCallback, useRef } from "react"
import { usePianoRoll } from "../../hooks/usePianoRoll"

const NavBackButton = styled.button`
  -webkit-appearance: none;
  border: none;
  outline: none;
  height: 2rem;
  background: none;
  color: inherit;
  cursor: pointer;

  &:hover {
    background: none;
    color: var(--color-text-secondary);
  }
`

interface ArrowIconProps {
  isOpen: boolean
}

const ArrowIcon: FC<ArrowIconProps> = ({ isOpen }) => (
  <ArrowLeft
    style={{
      transition: "transform 0.1s ease",
      transform: `scale(1.4) rotateZ(${isOpen ? "0deg" : "-90deg"})`,
    }}
  />
)

export const TrackListMenuButton: FC = () => {
  const { showTrackList, setShowTrackList } = usePianoRoll()
  const open = showTrackList
  const onClickNavBack = useCallback(
    () => setShowTrackList(!showTrackList),
    [showTrackList, setShowTrackList],
  )

  const ref = useRef<HTMLButtonElement>(null)

  return (
    <>
      <NavBackButton
        ref={ref}
        tabIndex={-1}
        onMouseDown={(e) => {
          e.preventDefault()
          onClickNavBack()
        }}
      >
        <ArrowIcon isOpen={open} />
      </NavBackButton>
    </>
  )
}
