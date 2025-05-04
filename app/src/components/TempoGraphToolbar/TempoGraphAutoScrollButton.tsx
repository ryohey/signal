import { FC } from "react"
import { useTickScroll } from "../../hooks/useTickScroll"
import { AutoScrollButton } from "../Toolbar/AutoScrollButton"

export const TempoGraphAutoScrollButton: FC = () => {
  const { setAutoScroll, autoScroll } = useTickScroll()

  return (
    <AutoScrollButton
      onClick={() => setAutoScroll(!autoScroll)}
      selected={autoScroll}
    />
  )
}
