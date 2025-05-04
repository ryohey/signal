import { FC, useCallback } from "react"
import { useTickScroll } from "../../hooks/useTickScroll"
import { AutoScrollButton } from "../Toolbar/AutoScrollButton"

export const ArrangeAutoScrollButton: FC = () => {
  const { autoScroll, setAutoScroll } = useTickScroll()

  const onClickAutoScroll = useCallback(
    () => setAutoScroll(!autoScroll),
    [autoScroll, setAutoScroll],
  )

  return <AutoScrollButton onClick={onClickAutoScroll} selected={autoScroll} />
}
