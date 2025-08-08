import { FC, useEffect, useState } from "react"
import { ElectronAPI } from "../../../../electron/src/ElectronAPI"
import { FirebaseCredential } from "../../../../electron/src/FirebaseCredential"

declare global {
  interface Window {
    readonly electronAPI: ElectronAPI
  }
}

export interface ElectronCallbackProps {
  onNewFile: () => void
  onClickOpenFile: () => void
  onOpenFile: (param: { filePath: string }) => void
  onSaveFile: () => void
  onSaveFileAs: () => void
  onRename: () => void
  onImport: () => void
  onExportWav: () => void
  onExportMp3: () => void
  onUndo: () => void
  onRedo: () => void
  onCut: () => void
  onCopy: () => void
  onPaste: () => void
  onDuplicate: () => void
  onDelete: () => void
  onSelectAll: () => void
  onSelectNextNote: () => void
  onSelectPreviousNote: () => void
  onTransposeUpOctave: () => void
  onTransposeDownOctave: () => void
  onTranspose: () => void
  onQuantize: () => void
  onVelocity: () => void
  onOpenSetting: () => void
  onOpenHelp: () => void
  onBrowserSignInCompleted: (param: { credential: FirebaseCredential }) => void
}

export const ElectronCallback: FC<ElectronCallbackProps> = ({
  onNewFile,
  onClickOpenFile,
  onOpenFile,
  onSaveFile,
  onSaveFileAs,
  onRename,
  onImport,
  onExportWav,
  onExportMp3,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onSelectAll,
  onSelectNextNote,
  onSelectPreviousNote,
  onTransposeUpOctave,
  onTransposeDownOctave,
  onTranspose,
  onQuantize,
  onVelocity,
  onOpenSetting,
  onOpenHelp,
  onBrowserSignInCompleted,
}) => {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => window.electronAPI.onNewFile(onNewFile), [onNewFile])
  useEffect(
    () => window.electronAPI.onClickOpenFile(onClickOpenFile),
    [onClickOpenFile],
  )
  useEffect(() => window.electronAPI.onOpenFile(onOpenFile), [onOpenFile])
  useEffect(() => window.electronAPI.onSaveFile(onSaveFile), [onSaveFile])
  useEffect(() => window.electronAPI.onSaveFileAs(onSaveFileAs), [onSaveFileAs])
  useEffect(() => window.electronAPI.onRename(onRename), [onRename])
  useEffect(() => window.electronAPI.onImport(onImport), [onImport])
  useEffect(() => window.electronAPI.onExportWav(onExportWav), [onExportWav])
  useEffect(() => window.electronAPI.onExportMp3(onExportMp3), [onExportMp3])
  useEffect(() => window.electronAPI.onUndo(onUndo), [onUndo])
  useEffect(() => window.electronAPI.onRedo(onRedo), [onRedo])
  useEffect(() => window.electronAPI.onCut(onCut), [onCut])
  useEffect(() => window.electronAPI.onCopy(onCopy), [onCopy])
  useEffect(() => window.electronAPI.onPaste(onPaste), [onPaste])
  useEffect(() => window.electronAPI.onDuplicate(onDuplicate), [onDuplicate])
  useEffect(() => window.electronAPI.onDelete(onDelete), [onDelete])
  useEffect(() => window.electronAPI.onSelectAll(onSelectAll), [onSelectAll])
  useEffect(
    () => window.electronAPI.onSelectNextNote(onSelectNextNote),
    [onSelectNextNote],
  )
  useEffect(
    () => window.electronAPI.onSelectPreviousNote(onSelectPreviousNote),
    [onSelectPreviousNote],
  )
  useEffect(
    () => window.electronAPI.onTransposeUpOctave(onTransposeUpOctave),
    [onTransposeUpOctave],
  )
  useEffect(
    () => window.electronAPI.onTransposeDownOctave(onTransposeDownOctave),
    [onTransposeDownOctave],
  )
  useEffect(() => window.electronAPI.onTranspose(onTranspose), [onTranspose])
  useEffect(() => window.electronAPI.onQuantize(onQuantize), [onQuantize])
  useEffect(() => window.electronAPI.onVelocity(onVelocity), [onVelocity])
  useEffect(
    () => window.electronAPI.onOpenSetting(onOpenSetting),
    [onOpenSetting],
  )
  useEffect(() => window.electronAPI.onOpenHelp(onOpenHelp), [onOpenHelp])
  useEffect(
    () => window.electronAPI.onBrowserSignInCompleted(onBrowserSignInCompleted),
    [onBrowserSignInCompleted],
  )

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true)
      window.electronAPI.ready()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <></>
}
