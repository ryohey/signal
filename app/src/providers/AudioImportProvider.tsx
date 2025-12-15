import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useState,
  useCallback,
} from "react"
import { AudioImportDialog } from "../components/AudioImportDialog/AudioImportDialog"
import { useAudioImportDialog } from "../hooks/useAudioImportDialog"

interface AudioImportContextType {
  openAudioImportDialog: (file: File) => void
}

const AudioImportContext = createContext<AudioImportContextType | null>(null)

export const useAudioImport = () => {
  const context = useContext(AudioImportContext)
  if (!context) {
    throw new Error("useAudioImport must be used within AudioImportProvider")
  }
  return context
}

export const AudioImportProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { file, isOpen, openDialog, closeDialog, handleImport } =
    useAudioImportDialog()

  const value = {
    openAudioImportDialog: openDialog,
  }

  return (
    <AudioImportContext.Provider value={value}>
      {children}
      {file && (
        <AudioImportDialog
          file={file}
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) closeDialog()
          }}
          onImport={handleImport}
        />
      )}
    </AudioImportContext.Provider>
  )
}
