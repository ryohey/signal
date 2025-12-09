import styled from "@emotion/styled"
import { FocusScope } from "@radix-ui/react-focus-scope"
import * as Portal from "@radix-ui/react-portal"
import { type FC, type ReactNode, useCallback, useEffect } from "react"
import type { Point } from "../../entities/geometry/Point"
import { Positioned } from "../ui/Positioned"

export const ContextMenuHotKey = styled.div`
  font-size: 0.9em;
  flex-grow: 1;
  text-align: right;
  color: var(--color-text-secondary);
  margin-left: 2em;
`

const Wrapper = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
`

const Content = styled(Positioned)`
  background: var(--color-background-secondary);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 3rem var(--color-shadow);
  border: 1px solid var(--color-popup-border);
  padding: 0.5rem 0;
`

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`

export interface ContextMenuProps {
  isOpen: boolean
  position: Point
  handleClose: () => void
  children?: ReactNode
}

const estimatedWidth = 200

export const ContextMenu: FC<ContextMenuProps> = ({
  isOpen,
  handleClose,
  position,
  children,
}) => {
  const onClickContent = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    []
  )

  // Menu cannot handle keydown while disabling focus, so we deal with global keydown event
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        handleClose()
      }
    }
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  // fix position to avoid placing menu outside of the screen
  const fixedX = Math.min(position.x, window.innerWidth - estimatedWidth)

  return (
    <Portal.Root>
      <Wrapper onClick={handleClose}>
        <FocusScope>
          <Content left={fixedX} top={position.y} onClick={onClickContent}>
            <List>{children}</List>
          </Content>
        </FocusScope>
      </Wrapper>
    </Portal.Root>
  )
}
