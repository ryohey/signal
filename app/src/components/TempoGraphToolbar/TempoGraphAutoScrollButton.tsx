import { FC } from "react"
import { useTempoEditor } from "../../hooks/useTempoEditor"
import { AutoScrollButton } from "../Toolbar/AutoScrollButton"

export const TempoGraphAutoScrollButton: FC = () => {
  const { setAutoScroll, autoScroll } = useTempoEditor()

  return (
    <AutoScrollButton
      onClick={() => setAutoScroll(!autoScroll)}
      selected={autoScroll}
    />
  )
}
