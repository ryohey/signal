import { FC, useCallback } from "react"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { AutoScrollButton } from "../Toolbar/AutoScrollButton"

export const PianoRollAutoScrollButton: FC = () => {
  const { autoScroll, setAutoScroll } = usePianoRoll()

  const onClickAutoScroll = useCallback(
    () => setAutoScroll(!autoScroll),
    [autoScroll, setAutoScroll],
  )

  return <AutoScrollButton onClick={onClickAutoScroll} selected={autoScroll} />
}
