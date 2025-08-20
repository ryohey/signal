import { useEffect } from "react"

export function useDisableZoom() {
  useEffect(() => {
    // prevent zooming
    const onWheel = (e: WheelEvent) => {
      // Touchpad pinches are translated into wheel with ctrl event
      if (e.ctrlKey) {
        e.preventDefault()
      }
    }

    document.addEventListener("wheel", onWheel, { passive: false })

    return () => document.removeEventListener("wheel", onWheel)
  }, [])
}
