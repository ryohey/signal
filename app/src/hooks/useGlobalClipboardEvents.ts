import { useEffect } from "react"
import { isRunningInElectron } from "../helpers/platform"

export function useGlobalClipboardEvents({
  onCopy,
  onCut,
  onPaste,
}: {
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
}) {
  useEffect(() => {
    document.addEventListener("cut", onCut)
    return () => {
      document.removeEventListener("cut", onCut)
    }
  }, [onCut])

  useEffect(() => {
    document.addEventListener("copy", onCopy)
    return () => {
      document.removeEventListener("copy", onCopy)
    }
  }, [onCopy])

  useEffect(() => {
    document.addEventListener("paste", onPaste)
    return () => {
      document.removeEventListener("paste", onPaste)
    }
  }, [onPaste])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onCopy(onCopy)
    }
  }, [onCopy])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onCut(onCut)
    }
  }, [onCut])

  useEffect(() => {
    if (isRunningInElectron()) {
      return window.electronAPI.onPaste(onPaste)
    }
  }, [onPaste])
}
