const DOUBLE_CLICK_INTERVAL = 500

// call from onMouseDown
export const observeDoubleClick = (onDoubleClick: () => void) => {
  let isMoved = false

  const onGlobalMouseMove = () => (isMoved = true)

  const onGlobalMouseDown = () => {
    if (!isMoved) {
      onDoubleClick()
    }
    removeListeners()
  }

  // wait a moment to prevent to catch mousedown event immediately
  setTimeout(() => {
    document.addEventListener("mousedown", onGlobalMouseDown)
    document.addEventListener("mousemove", onGlobalMouseMove)
  }, 1)

  const removeListeners = () => {
    document.removeEventListener("mousedown", onGlobalMouseDown)
    document.removeEventListener("mousemove", onGlobalMouseMove)
  }

  setTimeout(removeListeners, DOUBLE_CLICK_INTERVAL)
}
