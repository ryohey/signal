import { useEffect } from "react"

export function useDisableBrowserContextMenu() {
  useEffect(() => {
    document.oncontextmenu = (e) => e.preventDefault()

    return () => {
      document.oncontextmenu = null
    }
  }, [])
}
