import { useEffect } from "react"

export function useDisableBounceScroll() {
  useEffect(() => {
    // disable bounce scroll (Safari does not support overscroll-behavior CSS)
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
    }

    document.addEventListener("touchmove", onTouchMove, { passive: false })

    return () => document.removeEventListener("touchmove", onTouchMove)
  }, [])
}
