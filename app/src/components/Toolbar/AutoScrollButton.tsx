import styled from "@emotion/styled"
import KeyboardTab from "mdi-react/KeyboardTabIcon"
import { FC, useCallback } from "react"
import { useTickScroll } from "../../hooks/useTickScroll"
import { Localized } from "../../localize/useLocalization"
import { Tooltip } from "../ui/Tooltip"
import { ToolbarButton } from "./ToolbarButton"

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
}) => (
  <Tooltip title={<Localized name="auto-scroll" />}>
    <ToolbarButton
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      selected={selected}
    >
      <AutoScrollIcon />
    </ToolbarButton>
  </Tooltip>
)

export const AutoScrollButton: FC = () => {
  const { autoScroll, setAutoScroll } = useTickScroll()

  const onClickAutoScroll = useCallback(
    () => setAutoScroll(!autoScroll),
    [autoScroll, setAutoScroll],
  )

  return (
    <AutoScrollButtonContent
      onClick={onClickAutoScroll}
      selected={autoScroll}
    />
  )
}
