import styled from "@emotion/styled"
import ArrowLeft from "mdi-react/MenuLeftIcon"
import { type FC, useCallback, useRef } from "react"
import { useTrackList } from "../../hooks/useTrackList"

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
  const { isOpen, setOpen } = useTrackList()
  const onClickNavBack = useCallback(() => setOpen((prev) => !prev), [setOpen])
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
        <ArrowIcon isOpen={isOpen} />
      </NavBackButton>
    </>
  )
}
