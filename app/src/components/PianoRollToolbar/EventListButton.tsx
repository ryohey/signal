import FormatListBulleted from "mdi-react/FormatListBulletedIcon"
import { FC, MouseEvent, useCallback } from "react"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { Localized } from "../../localize/useLocalization"
import { ToolbarButton } from "../Toolbar/ToolbarButton"
import { Tooltip } from "../ui/Tooltip"

export const EventListButton: FC = () => {
  const { showEventList, setShowEventList } = usePianoRoll()

  return (
    <Tooltip title={<Localized name="event-list" />}>
      <ToolbarButton
        selected={showEventList}
        onMouseDown={useCallback(
          (e: MouseEvent) => {
            e.preventDefault()
            setShowEventList(!showEventList)
          },
          [showEventList, setShowEventList],
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
