import { useCallback, useMemo, useState } from "react"

export interface AbstractMouseEvent {
  preventDefault: () => void
  clientX: number
  clientY: number
}

export const useContextMenu = () => {
  const [state, setState] = useState({
    mouseX: 0,
    mouseY: 0,
    isOpen: false,
  })

  const onContextMenu = useCallback((e: AbstractMouseEvent) => {
    e.preventDefault()
    setState({
      mouseX: e.clientX - 2,
      mouseY: e.clientY - 4,
      isOpen: true,
    })
  }, [])

  const handleClose = useCallback(() => {
    setState((state) => ({ ...state, isOpen: false }))
  }, [])

  const position = useMemo(
    () => ({
      x: state.mouseX,
      y: state.mouseY,
    }),
    [state.mouseX, state.mouseY]
  )

  return {
    onContextMenu,
    menuProps: {
      handleClose,
      isOpen: state.isOpen,
      position,
    },
  }
}
