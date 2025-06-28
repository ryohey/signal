import styled from "@emotion/styled"
import KeyboardTab from "mdi-react/KeyboardTabIcon"
import { FC } from "react"
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

export const AutoScrollButton: FC<AutoScrollButtonProps> = ({
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
