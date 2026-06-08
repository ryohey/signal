import FormatListBulleted from "mdi-react/FormatListBulletedIcon"
import { FC, MouseEvent, useCallback } from "react"
import { ToolbarButton } from "../../../../components/Toolbar/ToolbarButton"
import { Tooltip } from "../../../../components/ui/Tooltip"
import { Localized } from "../../../../localize/useLocalization"
import { useEventList } from "../../../event-list/hooks/useEventList"

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
