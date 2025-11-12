import FormatListBulleted from "mdi-react/FormatListBulletedIcon"
import { FC, MouseEvent, useCallback } from "react"
import { useEventList } from "../../hooks/useEventList"
import { Localized } from "../../localize/useLocalization"
import { ToolbarButton } from "../Toolbar/ToolbarButton"
import { Tooltip } from "../ui/Tooltip"

export const EventListButton: FC = () => {
  const { setOpen, isOpen } = useEventList()

  return (
    <Tooltip title={<Localized name="event-list" />}>
      <ToolbarButton
        selected={isOpen}
        onMouseDown={useCallback(
          (e: MouseEvent) => {
            e.preventDefault()
            setOpen((prev) => !prev)
          },
          [setOpen],
        )}
      >
        <FormatListBulleted
          style={{
            width: "1.2rem",
            fill: "currentColor",
          }}
        />
      </ToolbarButton>
    </Tooltip>
  )
}
