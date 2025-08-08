import { useCallback } from "react"
import { usePlayer } from "../hooks/usePlayer"
import { useStores } from "../hooks/useStores"

export const useToggleRecording = () => {
  const { midiRecorder } = useStores()
  const { play, stop } = usePlayer()

  return useCallback(() => {
    if (midiRecorder.isRecording) {
      midiRecorder.isRecording = false
      stop()
    } else {
      midiRecorder.isRecording = true
      play()
    }
  }, [midiRecorder, play, stop])
}
