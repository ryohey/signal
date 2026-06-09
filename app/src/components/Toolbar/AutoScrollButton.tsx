import styled from "@emotion/styled"
import { ToolbarButton, Tooltip } from "@signal-app/ui"
import KeyboardTab from "mdi-react/KeyboardTabIcon"
import { FC, useCallback } from "react"
import { useTickScroll } from "../../hooks/useTickScroll"
import { Localized } from "../../localize/useLocalization"

const AutoScrollIcon = styled(KeyboardTab)`
  width: 1.2rem;
  fill: currentColor;
`

export interface AutoScrollButtonProps {
  onClick: () => void
  selected: boolean
}

const AutoScrollButtonContent: FC<AutoScrollButtonProps> = ({
  onClick,
  selected,
}) => {
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onClick()
    },
    [onClick],
  )
  return (
    <Tooltip title={<Localized name="auto-scroll" />}>
      <ToolbarButton onMouseDown={onMouseDown} selected={selected}>
        <AutoScrollIcon />
      </ToolbarButton>
    </Tooltip>
  )
}

export const AutoScrollButton: FC = () => {
  const { autoScroll, setAutoScroll } = useTickScroll()

  const onClickAutoScroll = useCallback(
    () => setAutoScroll((prev) => !prev),
    [setAutoScroll],
  )

  return (
    <AutoScrollButtonContent
      onClick={onClickAutoScroll}
      selected={autoScroll}
    />
  )
}
