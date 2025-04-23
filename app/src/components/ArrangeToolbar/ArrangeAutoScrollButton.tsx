import { FC, useCallback } from "react"
import { useArrangeView } from "../../hooks/useArrangeView"
import { AutoScrollButton } from "../Toolbar/AutoScrollButton"

export const ArrangeAutoScrollButton: FC = () => {
  const { autoScroll, setAutoScroll } = useArrangeView()

  const onClickAutoScroll = useCallback(
    () => setAutoScroll(!autoScroll),
    [autoScroll, setAutoScroll],
  )

  return <AutoScrollButton onClick={onClickAutoScroll} selected={autoScroll} />
}
