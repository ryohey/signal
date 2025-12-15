import { useState, useCallback } from "react"
import { useImportAudio } from "../actions/audioImport"
import type { NoteQuantizationSettings } from "../helpers/basicPitchConverter"

export const useAudioImportDialog = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { importAudio, isProcessing, progress } = useImportAudio()

  const openDialog = useCallback((audioFile: File) => {
    setFile(audioFile)
    setIsOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setIsOpen(false)
    setFile(null)
  }, [])

  const handleImport = useCallback(
    async (settings: NoteQuantizationSettings) => {
      if (!file) return

      const result = await importAudio(file, settings)
      if (result.success) {
        closeDialog()
      }
      return result
    },
    [file, importAudio, closeDialog],
  )

  return {
    file,
    isOpen,
    openDialog,
    closeDialog,
    handleImport,
    isProcessing,
    progress,
  }
}
